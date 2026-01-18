import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import pino from 'pino';

const router = Router();
const logger = pino();

// Base path for Docker deployment
const basePath = '/SellMePRT';

// Helper to get branding settings
async function getBranding() {
  let branding = await prisma.branding.findFirst();
  if (!branding) {
    branding = await prisma.branding.create({
      data: {
        id: 'default',
        primaryColor: '#b45309',
        secondaryColor: '#92400e',
        accentColor: '#d97706',
        headingFont: 'Inter',
        bodyFont: 'Inter'
      }
    });
  }
  return branding;
}

// Auth middleware
function requireToken(req: Request, res: Response, next: NextFunction) {
  const token = req.query.token || req.body.token;
  const validToken = process.env.ADMIN_TOKEN || 'admin';

  if (token !== validToken) {
    return res.status(401).render('admin/error', { error: 'Unauthorized', token: '' });
  }
  res.locals.token = token;
  next();
}

router.use(requireToken);

// Dashboard
router.get('/', async (req, res) => {
  try {
    const config = await prisma.appConfig.findFirst();
    const branding = await getBranding();
    const sessions = await prisma.salesSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const totalSessions = await prisma.salesSession.count();
    const salesMade = await prisma.salesSession.count({ where: { outcome: 'sale_made' } });
    const conversionRate = totalSessions > 0 ? ((salesMade / totalSessions) * 100).toFixed(1) : 0;

    const analytics = await prisma.globalAnalytics.findFirst({
      orderBy: { date: 'desc' }
    });

    res.render('admin/dashboard', {
      token: res.locals.token,
      active: 'dashboard',
      config,
      branding,
      basePath,
      sessions,
      stats: {
        totalSessions,
        salesMade,
        conversionRate,
        avgMessages: analytics?.avgMessagesToClose || 0
      }
    });
  } catch (err) {
    logger.error({ err }, 'Dashboard error');
    res.render('admin/error', { error: 'Failed to load dashboard', token: res.locals.token, branding: null, basePath });
  }
});

// Sessions List
router.get('/sessions', async (req, res) => {
  try {
    const branding = await getBranding();
    const sessions = await prisma.salesSession.findMany({
      orderBy: { createdAt: 'desc' },
      include: { analytics: true }
    });

    res.render('admin/sessions', {
      token: res.locals.token,
      active: 'sessions',
      branding,
      basePath,
      sessions
    });
  } catch (err) {
    logger.error({ err }, 'Sessions error');
    res.render('admin/error', { error: 'Failed to load sessions', token: res.locals.token, branding: null, basePath });
  }
});

// Session Detail
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const branding = await getBranding();
    const session = await prisma.salesSession.findUnique({
      where: { sessionId: req.params.sessionId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        analytics: true
      }
    });

    if (!session) {
      return res.render('admin/error', { error: 'Session not found', token: res.locals.token, branding: null, basePath });
    }

    res.render('admin/session_detail', {
      token: res.locals.token,
      active: 'sessions',
      branding,
      basePath,
      session
    });
  } catch (err) {
    logger.error({ err }, 'Session detail error');
    res.render('admin/error', { error: 'Failed to load session', token: res.locals.token, branding: null, basePath });
  }
});

// Greeting Configuration
router.get('/greeting', async (req, res) => {
  try {
    const branding = await getBranding();
    const config = await prisma.appConfig.findFirst();
    res.render('admin/greeting', {
      token: res.locals.token,
      active: 'greeting',
      branding,
      basePath,
      greeting: config?.greeting || '',
      triggerPhrase: config?.triggerPhrase || 'sell me a pen'
    });
  } catch (err) {
    res.render('admin/error', { error: 'Failed to load greeting config', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/greeting', async (req, res) => {
  try {
    const { greeting, triggerPhrase } = req.body;
    await prisma.appConfig.updateMany({
      data: { greeting, triggerPhrase }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save' });
  }
});

// Pen Product Configuration
router.get('/product', async (req, res) => {
  try {
    const branding = await getBranding();
    const product = await prisma.penProduct.findFirst();
    res.render('admin/product', {
      token: res.locals.token,
      active: 'product',
      branding,
      basePath,
      product
    });
  } catch (err) {
    res.render('admin/error', { error: 'Failed to load product config', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/product', async (req, res) => {
  try {
    const { name, tagline, basePrice, premiumPrice, features, benefits, variants, scarcityMessage } = req.body;
    await prisma.penProduct.updateMany({
      data: {
        name,
        tagline,
        basePrice: parseFloat(basePrice),
        premiumPrice: parseFloat(premiumPrice),
        features,
        benefits,
        variants,
        scarcityMessage
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save' });
  }
});

// Sales Techniques
router.get('/techniques', async (req, res) => {
  try {
    const branding = await getBranding();
    const techniques = await prisma.salesTechnique.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
    });

    // Calculate success rates
    const techniquesWithRates = techniques.map(t => ({
      ...t,
      successRate: t.usageCount > 0 ? ((t.successCount / t.usageCount) * 100).toFixed(1) : 0
    }));

    res.render('admin/techniques', {
      token: res.locals.token,
      active: 'techniques',
      branding,
      basePath,
      techniques: techniquesWithRates
    });
  } catch (err) {
    res.render('admin/error', { error: 'Failed to load techniques', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/techniques/:id/toggle', async (req, res) => {
  try {
    const technique = await prisma.salesTechnique.findUnique({ where: { id: req.params.id } });
    if (technique) {
      await prisma.salesTechnique.update({
        where: { id: req.params.id },
        data: { enabled: !technique.enabled }
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Discovery Questions
router.get('/discovery', async (req, res) => {
  try {
    const branding = await getBranding();
    const questions = await prisma.discoveryQuestion.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.render('admin/discovery', {
      token: res.locals.token,
      active: 'discovery',
      branding,
      basePath,
      questions
    });
  } catch (err) {
    res.render('admin/error', { error: 'Failed to load discovery questions', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/discovery', async (req, res) => {
  try {
    const { question, purpose, followUp, targetNeed } = req.body;
    await prisma.discoveryQuestion.create({
      data: { question, purpose, followUp, targetNeed }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/discovery/:id', async (req, res) => {
  try {
    await prisma.discoveryQuestion.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Closing Strategies
router.get('/closing', async (req, res) => {
  try {
    const branding = await getBranding();
    const strategies = await prisma.closingStrategy.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.render('admin/closing', {
      token: res.locals.token,
      active: 'closing',
      branding,
      basePath,
      strategies
    });
  } catch (err) {
    res.render('admin/error', { error: 'Failed to load closing strategies', token: res.locals.token, branding: null, basePath });
  }
});

// Objection Handlers
router.get('/objections', async (req, res) => {
  try {
    const branding = await getBranding();
    const handlers = await prisma.objectionHandler.findMany({
      orderBy: { category: 'asc' }
    });
    res.render('admin/objections', {
      token: res.locals.token,
      active: 'objections',
      branding,
      basePath,
      handlers
    });
  } catch (err) {
    res.render('admin/error', { error: 'Failed to load objection handlers', token: res.locals.token, branding: null, basePath });
  }
});

// AI Prompt Configuration
router.get('/ai-config', async (req, res) => {
  try {
    const branding = await getBranding();
    const config = await prisma.aIPromptConfig.findFirst();
    const appConfig = await prisma.appConfig.findFirst();
    res.render('admin/ai_config', {
      token: res.locals.token,
      active: 'ai-config',
      branding,
      basePath,
      config,
      appConfig
    });
  } catch (err) {
    res.render('admin/error', { error: 'Failed to load AI config', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/ai-config', async (req, res) => {
  try {
    const { systemPrompt, discoveryPrompt, positioningPrompt, closingPrompt, maxClosingAttempts, successKeywords, objectionKeywords } = req.body;

    await prisma.aIPromptConfig.updateMany({
      data: { systemPrompt, discoveryPrompt, positioningPrompt, closingPrompt }
    });

    if (maxClosingAttempts || successKeywords || objectionKeywords) {
      await prisma.appConfig.updateMany({
        data: {
          ...(maxClosingAttempts && { maxClosingAttempts: parseInt(maxClosingAttempts) }),
          ...(successKeywords && { successKeywords }),
          ...(objectionKeywords && { objectionKeywords })
        }
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Analytics
router.get('/analytics', async (req, res) => {
  try {
    const branding = await getBranding();
    // Get recent sessions for charts
    const sessions = await prisma.salesSession.findMany({
      where: { endedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { analytics: true }
    });

    // Calculate stats
    const totalSessions = sessions.length;
    const salesMade = sessions.filter(s => s.outcome === 'sale_made').length;
    const noSale = sessions.filter(s => s.outcome === 'no_sale').length;
    const abandoned = sessions.filter(s => s.outcome === 'abandoned').length;
    const conversionRate = totalSessions > 0 ? ((salesMade / totalSessions) * 100).toFixed(1) : 0;

    // Get technique performance
    const techniques = await prisma.salesTechnique.findMany({
      orderBy: { successCount: 'desc' },
      take: 10
    });

    // Recent insights
    const insights = await prisma.learningInsight.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.render('admin/analytics', {
      token: res.locals.token,
      active: 'analytics',
      branding,
      basePath,
      stats: {
        totalSessions,
        salesMade,
        noSale,
        abandoned,
        conversionRate
      },
      techniques,
      insights,
      sessions
    });
  } catch (err) {
    logger.error({ err }, 'Analytics error');
    res.render('admin/error', { error: 'Failed to load analytics', token: res.locals.token, branding: null, basePath });
  }
});

// Settings - Combined Store Info, Branding, Payment Gateways
router.get('/settings', async (req, res) => {
  try {
    const branding = await getBranding();
    const storeInfo = await prisma.storeInfo.findFirst();
    const paymentSettings = await prisma.paymentSettings.findFirst();

    // Combine all settings into one object for the template
    const settings = {
      // Store Info
      businessName: storeInfo?.businessName || '',
      tagline: storeInfo?.tagline || '',
      description: storeInfo?.description || '',
      address: storeInfo?.address || '',
      phone: storeInfo?.phone || '',
      email: storeInfo?.email || '',
      website: storeInfo?.website || '',
      businessHours: storeInfo?.businessHours || '',
      timezone: storeInfo?.timezone || 'America/New_York',
      // Branding
      logoUrl: branding?.logoUrl || '',
      faviconUrl: branding?.faviconUrl || '',
      primaryColor: branding?.primaryColor || '#b45309',
      secondaryColor: branding?.secondaryColor || '#92400e',
      accentColor: branding?.accentColor || '#d97706',
      headingFont: branding?.headingFont || 'Inter',
      bodyFont: branding?.bodyFont || 'Inter',
      // Payment Settings
      paymentsEnabled: paymentSettings?.enabled || false,
      stripeEnabled: paymentSettings?.stripeEnabled || false,
      stripePublishableKey: paymentSettings?.stripePublishableKey || '',
      stripeTestMode: paymentSettings?.stripeTestMode ?? true,
      paypalEnabled: paymentSettings?.paypalEnabled || false,
      paypalClientId: paymentSettings?.paypalClientId || '',
      paypalSandbox: paymentSettings?.paypalSandbox ?? true,
      squareEnabled: paymentSettings?.squareEnabled || false,
      squareAppId: paymentSettings?.squareAppId || '',
      squareSandbox: paymentSettings?.squareSandbox ?? true
    };

    res.render('admin/settings', {
      token: res.locals.token,
      active: 'settings',
      branding,
      basePath,
      settings
    });
  } catch (err) {
    logger.error({ err }, 'Settings page error');
    res.render('admin/error', { error: 'Failed to load settings', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const {
      // Store Info
      businessName, tagline, description, address, phone, email, website, businessHours, timezone,
      // Branding
      logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor, headingFont, bodyFont,
      // Payment Settings
      paymentsEnabled, stripeEnabled, stripePublishableKey, stripeTestMode,
      paypalEnabled, paypalClientId, paypalSandbox, squareEnabled, squareAppId, squareSandbox
    } = req.body;

    // Update StoreInfo
    await prisma.storeInfo.upsert({
      where: { id: 'default' },
      update: { businessName, tagline, description, address, phone, email, website, businessHours, timezone },
      create: { id: 'default', businessName, tagline, description, address, phone, email, website, businessHours, timezone }
    });

    // Update Branding
    await prisma.branding.upsert({
      where: { id: 'default' },
      update: { logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor, headingFont, bodyFont },
      create: { id: 'default', logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor, headingFont, bodyFont }
    });

    // Update PaymentSettings
    await prisma.paymentSettings.upsert({
      where: { id: 'default' },
      update: {
        enabled: paymentsEnabled,
        stripeEnabled,
        stripePublishableKey,
        stripeTestMode,
        paypalEnabled,
        paypalClientId,
        paypalSandbox,
        squareEnabled,
        squareAppId,
        squareSandbox
      },
      create: {
        id: 'default',
        enabled: paymentsEnabled,
        stripeEnabled,
        stripePublishableKey,
        stripeTestMode,
        paypalEnabled,
        paypalClientId,
        paypalSandbox,
        squareEnabled,
        squareAppId,
        squareSandbox
      }
    });

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Settings save error');
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// ============================================
// Voices & Mode Configuration
// ============================================

router.get('/voices', async (req, res) => {
  try {
    const branding = await getBranding();
    const config = await prisma.appConfig.findFirst();

    // Get or create default languages
    let languages = await prisma.language.findMany({
      orderBy: { name: 'asc' }
    });

    // Seed default languages if none exist
    if (languages.length === 0) {
      const defaultLangs = [
        { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
        { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
        { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文', flag: '🇨🇳' },
        { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
        { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
        { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
        { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' }
      ];

      for (const lang of defaultLangs) {
        await prisma.language.create({ data: lang });
      }

      languages = await prisma.language.findMany({
        orderBy: { name: 'asc' }
      });
    }

    // Add docCount to each language (0 for this app - no KB)
    const languagesWithDocs = languages.map(lang => ({
      ...lang,
      docCount: 0
    }));

    res.render('admin/voices', {
      token: res.locals.token,
      active: 'voices',
      branding,
      basePath,
      config,
      languages: languagesWithDocs,
      totalDocs: 0
    });
  } catch (err) {
    logger.error({ err }, 'Voices page error');
    res.render('admin/error', { error: 'Failed to load voices config', token: res.locals.token, branding: null, basePath });
  }
});

// Select voice
router.post('/voices/select', async (req, res) => {
  try {
    const { voice } = req.body;
    await prisma.appConfig.updateMany({
      data: { selectedVoice: voice }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Voice select error');
    res.status(500).json({ success: false, error: 'Failed to update voice' });
  }
});

// Set sales mode (ai_sells or user_sells)
router.post('/voices/mode', async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['ai_sells', 'user_sells'].includes(mode)) {
      return res.status(400).json({ success: false, error: 'Invalid mode' });
    }
    await prisma.appConfig.updateMany({
      data: { salesMode: mode }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Mode update error');
    res.status(500).json({ success: false, error: 'Failed to update mode' });
  }
});

// Set difficulty level
router.post('/voices/difficulty', async (req, res) => {
  try {
    const { difficulty } = req.body;
    if (!['easy', 'medium', 'hard', 'expert'].includes(difficulty)) {
      return res.status(400).json({ success: false, error: 'Invalid difficulty' });
    }
    await prisma.appConfig.updateMany({
      data: { difficulty }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Difficulty update error');
    res.status(500).json({ success: false, error: 'Failed to update difficulty' });
  }
});

// Add new language
router.post('/voices/language', async (req, res) => {
  try {
    const { code, name, nativeName, flag } = req.body;

    // Check if language already exists
    const existing = await prisma.language.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Language already exists' });
    }

    const language = await prisma.language.create({
      data: { code, name, nativeName, flag: flag || '🌐' }
    });
    res.json({ success: true, language });
  } catch (err) {
    logger.error({ err }, 'Add language error');
    res.status(500).json({ success: false, error: 'Failed to add language' });
  }
});

// Toggle language enabled/disabled
router.post('/voices/language/:id', async (req, res) => {
  try {
    const language = await prisma.language.findUnique({ where: { id: req.params.id } });
    if (!language) {
      return res.status(404).json({ success: false, error: 'Language not found' });
    }

    await prisma.language.update({
      where: { id: req.params.id },
      data: { enabled: !language.enabled }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Toggle language error');
    res.status(500).json({ success: false, error: 'Failed to toggle language' });
  }
});

// Set primary language
router.post('/voices/primary-language', async (req, res) => {
  try {
    const { languageCode } = req.body;
    await prisma.appConfig.updateMany({
      data: { primaryLanguage: languageCode }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Primary language update error');
    res.status(500).json({ success: false, error: 'Failed to update primary language' });
  }
});

// Delete language
router.delete('/voices/language/:id', async (req, res) => {
  try {
    await prisma.language.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Delete language error');
    res.status(500).json({ success: false, error: 'Failed to delete language' });
  }
});

// ============================================
// Features Configuration
// ============================================

router.get('/features', async (req, res) => {
  try {
    const branding = await getBranding();
    const features = await prisma.features.findFirst();

    res.render('admin/features', {
      token: res.locals.token,
      active: 'features',
      branding,
      basePath,
      features
    });
  } catch (err) {
    logger.error({ err }, 'Features page error');
    res.render('admin/error', { error: 'Failed to load features', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/features', async (req, res) => {
  try {
    const {
      // Feature Configuration
      faqEnabled, stickyBarEnabled, stickyBarText, stickyBarColor, stickyBarLink, stickyBarLinkText,
      // Live Chat
      liveChatEnabled, chatProvider, chatWelcomeMessage, chatAgentName, chatWidgetColor,
      chatPosition, chatShowOnMobile, chatWidgetId, chatEmbedCode,
      // Notifications
      emailNotifications, smsNotifications, pushNotifications, orderConfirmations,
      marketingEmails, appointmentReminders,
      // Social Media
      facebookUrl, twitterUrl, instagramUrl, linkedinUrl, youtubeUrl, tiktokUrl,
      shareOnFacebook, shareOnTwitter, shareOnLinkedin, shareOnWhatsapp, shareOnEmail, copyLinkButton
    } = req.body;

    await prisma.features.upsert({
      where: { id: 'default' },
      update: {
        faqEnabled,
        stickyBarEnabled,
        stickyBarText,
        stickyBarBgColor: stickyBarColor,
        stickyBarLink,
        stickyBarLinkText,
        liveChatEnabled,
        chatProvider,
        chatWelcomeMessage,
        chatAgentName,
        chatWidgetColor,
        chatPosition,
        chatShowOnMobile,
        chatWidgetId,
        chatEmbedCode,
        emailNotifications,
        smsNotifications,
        pushNotifications,
        orderConfirmations,
        marketingEmails,
        appointmentReminders,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        linkedinUrl,
        youtubeUrl,
        tiktokUrl,
        shareOnFacebook,
        shareOnTwitter,
        shareOnLinkedin,
        shareOnWhatsapp,
        shareOnEmail,
        copyLinkButton
      },
      create: {
        id: 'default',
        faqEnabled,
        stickyBarEnabled,
        stickyBarText,
        stickyBarBgColor: stickyBarColor || '#b45309',
        stickyBarLink,
        stickyBarLinkText,
        liveChatEnabled,
        chatProvider,
        chatWelcomeMessage,
        chatAgentName,
        chatWidgetColor: chatWidgetColor || '#b45309',
        chatPosition,
        chatShowOnMobile,
        chatWidgetId,
        chatEmbedCode,
        emailNotifications,
        smsNotifications,
        pushNotifications,
        orderConfirmations,
        marketingEmails,
        appointmentReminders,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        linkedinUrl,
        youtubeUrl,
        tiktokUrl,
        shareOnFacebook,
        shareOnTwitter,
        shareOnLinkedin,
        shareOnWhatsapp,
        shareOnEmail,
        copyLinkButton
      }
    });

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Features save error');
    res.status(500).json({ success: false, error: 'Failed to save features' });
  }
});

// ============================================
// AI Agents
// ============================================

router.get('/ai-agents', async (req, res) => {
  try {
    const branding = await getBranding();
    const agents = await prisma.aIAgent.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.render('admin/ai-agents', {
      token: res.locals.token,
      active: 'ai-agents',
      branding,
      basePath,
      agents
    });
  } catch (err) {
    logger.error({ err }, 'AI Agents page error');
    res.render('admin/error', { error: 'Failed to load AI agents', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/ai-agents', async (req, res) => {
  try {
    const { name, description, systemPrompt, model, voice, temperature } = req.body;
    await prisma.aIAgent.create({
      data: { name, description, systemPrompt, model, voice, temperature: parseFloat(temperature) || 0.7 }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create agent' });
  }
});

router.delete('/ai-agents/:id', async (req, res) => {
  try {
    await prisma.aIAgent.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// AI Tools
// ============================================

router.get('/ai-tools', async (req, res) => {
  try {
    const branding = await getBranding();
    const tools = await prisma.aITool.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.render('admin/ai-tools', {
      token: res.locals.token,
      active: 'ai-tools',
      branding,
      basePath,
      tools
    });
  } catch (err) {
    logger.error({ err }, 'AI Tools page error');
    res.render('admin/error', { error: 'Failed to load AI tools', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/ai-tools', async (req, res) => {
  try {
    const { name, description, type, schema, endpoint } = req.body;
    await prisma.aITool.create({
      data: { name, description, type, schema, endpoint }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create tool' });
  }
});

router.delete('/ai-tools/:id', async (req, res) => {
  try {
    await prisma.aITool.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// Knowledge Base
// ============================================

router.get('/knowledge-base', async (req, res) => {
  try {
    const branding = await getBranding();
    const documents = await prisma.knowledgeDoc.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const languages = await prisma.language.findMany({ where: { enabled: true } });

    res.render('admin/knowledge-base', {
      token: res.locals.token,
      active: 'knowledge-base',
      branding,
      basePath,
      documents: documents.map(d => ({
        ...d,
        type: 'txt',
        size: `${Math.round(d.content.length / 1024)} KB`,
        status: 'processed',
        languageCode: d.language,
        languageFlag: '🌐'
      })),
      languages,
      totalSize: `${Math.round(documents.reduce((sum, d) => sum + d.content.length, 0) / 1024)} KB`,
      languageCount: new Set(documents.map(d => d.language)).size,
      currentLanguage: req.query.language || null
    });
  } catch (err) {
    logger.error({ err }, 'Knowledge Base page error');
    res.render('admin/error', { error: 'Failed to load knowledge base', token: res.locals.token, branding: null, basePath });
  }
});

router.delete('/knowledge-base/:id', async (req, res) => {
  try {
    await prisma.knowledgeDoc.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// Logic Rules
// ============================================

router.get('/logic-rules', async (req, res) => {
  try {
    const branding = await getBranding();
    const rules = await prisma.logicRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });
    res.render('admin/logic-rules', {
      token: res.locals.token,
      active: 'logic-rules',
      branding,
      basePath,
      rules
    });
  } catch (err) {
    logger.error({ err }, 'Logic Rules page error');
    res.render('admin/error', { error: 'Failed to load logic rules', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/logic-rules', async (req, res) => {
  try {
    const { name, description, trigger, conditions, actions, priority } = req.body;
    await prisma.logicRule.create({
      data: { name, description, trigger, conditions, actions, priority: parseInt(priority) || 0 }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create rule' });
  }
});

router.delete('/logic-rules/:id', async (req, res) => {
  try {
    await prisma.logicRule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// Functions
// ============================================

router.get('/functions', async (req, res) => {
  try {
    const branding = await getBranding();
    const functions = await prisma.function.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.render('admin/functions', {
      token: res.locals.token,
      active: 'functions',
      branding,
      basePath,
      functions
    });
  } catch (err) {
    logger.error({ err }, 'Functions page error');
    res.render('admin/error', { error: 'Failed to load functions', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/functions', async (req, res) => {
  try {
    const { name, description, code, parameters, returnType } = req.body;
    await prisma.function.create({
      data: { name, description, code, parameters, returnType }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create function' });
  }
});

router.delete('/functions/:id', async (req, res) => {
  try {
    await prisma.function.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// SMS Settings
// ============================================

router.get('/sms-settings', async (req, res) => {
  try {
    const branding = await getBranding();
    const settings = await prisma.sMSSettings.findFirst();
    res.render('admin/sms-settings', {
      token: res.locals.token,
      active: 'sms-settings',
      branding,
      basePath,
      settings
    });
  } catch (err) {
    logger.error({ err }, 'SMS Settings page error');
    res.render('admin/error', { error: 'Failed to load SMS settings', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/sms-settings', async (req, res) => {
  try {
    const { provider, accountSid, authToken, fromNumber, enableReminders, reminderHours, isActive } = req.body;
    await prisma.sMSSettings.upsert({
      where: { id: 'default' },
      update: { provider, accountSid, authToken, fromNumber, enableReminders, reminderHours: parseInt(reminderHours) || 24, isActive },
      create: { id: 'default', provider, accountSid, authToken, fromNumber, enableReminders, reminderHours: parseInt(reminderHours) || 24, isActive }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save SMS settings' });
  }
});

// ============================================
// Call Transfer
// ============================================

router.get('/call-transfer', async (req, res) => {
  try {
    const branding = await getBranding();
    const transfers = await prisma.callTransfer.findMany({
      orderBy: [{ priority: 'desc' }, { name: 'asc' }]
    });
    res.render('admin/call-transfer', {
      token: res.locals.token,
      active: 'call-transfer',
      branding,
      basePath,
      transfers
    });
  } catch (err) {
    logger.error({ err }, 'Call Transfer page error');
    res.render('admin/error', { error: 'Failed to load call transfers', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/call-transfer', async (req, res) => {
  try {
    const { name, description, phoneNumber, sipUri, priority } = req.body;
    await prisma.callTransfer.create({
      data: { name, description, phoneNumber, sipUri, priority: parseInt(priority) || 0 }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create transfer' });
  }
});

router.delete('/call-transfer/:id', async (req, res) => {
  try {
    await prisma.callTransfer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// DTMF Menu
// ============================================

router.get('/dtmf-menu', async (req, res) => {
  try {
    const branding = await getBranding();
    const menuItems = await prisma.dTMFMenu.findMany({
      orderBy: { digit: 'asc' }
    });
    res.render('admin/dtmf-menu', {
      token: res.locals.token,
      active: 'dtmf-menu',
      branding,
      basePath,
      menuItems
    });
  } catch (err) {
    logger.error({ err }, 'DTMF Menu page error');
    res.render('admin/error', { error: 'Failed to load DTMF menu', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/dtmf-menu', async (req, res) => {
  try {
    const { name, digit, action, targetId, prompt } = req.body;
    await prisma.dTMFMenu.create({
      data: { name, digit, action, targetId, prompt }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create menu item' });
  }
});

router.delete('/dtmf-menu/:id', async (req, res) => {
  try {
    await prisma.dTMFMenu.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// Webhooks
// ============================================

router.get('/webhooks', async (req, res) => {
  try {
    const branding = await getBranding();
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.render('admin/webhooks', {
      token: res.locals.token,
      active: 'webhooks',
      branding,
      basePath,
      webhooks
    });
  } catch (err) {
    logger.error({ err }, 'Webhooks page error');
    res.render('admin/error', { error: 'Failed to load webhooks', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/webhooks', async (req, res) => {
  try {
    const { name, url, events, secret } = req.body;
    await prisma.webhook.create({
      data: { name, url, events, secret }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create webhook' });
  }
});

router.delete('/webhooks/:id', async (req, res) => {
  try {
    await prisma.webhook.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// Users
// ============================================

router.get('/users', async (req, res) => {
  try {
    const branding = await getBranding();
    const users = await prisma.user.findMany({
      include: { company: true },
      orderBy: { createdAt: 'desc' }
    });
    const companies = await prisma.company.findMany();
    res.render('admin/users', {
      token: res.locals.token,
      active: 'users',
      branding,
      basePath,
      users,
      companies
    });
  } catch (err) {
    logger.error({ err }, 'Users page error');
    res.render('admin/error', { error: 'Failed to load users', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { email, username, password, name, role, companyId } = req.body;
    await prisma.user.create({
      data: { email, username, password, name, role, companyId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// Companies
// ============================================

router.get('/companies', async (req, res) => {
  try {
    const branding = await getBranding();
    const companies = await prisma.company.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.render('admin/companies', {
      token: res.locals.token,
      active: 'companies',
      branding,
      basePath,
      companies: companies.map(c => ({
        ...c,
        userCount: c._count.users,
        sessionCount: 0,
        productCount: 0
      })),
      total: companies.length
    });
  } catch (err) {
    logger.error({ err }, 'Companies page error');
    res.render('admin/error', { error: 'Failed to load companies', token: res.locals.token, branding: null, basePath });
  }
});

router.post('/companies', async (req, res) => {
  try {
    const { name, domain, settings } = req.body;
    await prisma.company.create({
      data: { name, domain, settings: settings || '{}' }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create company' });
  }
});

router.delete('/companies/:id', async (req, res) => {
  try {
    await prisma.company.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// Payments
// ============================================

router.get('/payments', async (req, res) => {
  try {
    const branding = await getBranding();
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    const stats = {
      totalRevenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
      thisMonth: payments.filter(p => {
        const now = new Date();
        const paymentDate = new Date(p.createdAt);
        return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear() && p.status === 'completed';
      }).reduce((sum, p) => sum + p.amount, 0),
      pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
      transactions: payments.length
    };

    res.render('admin/payments', {
      token: res.locals.token,
      active: 'payments',
      branding,
      basePath,
      payments,
      totalRevenue: stats.totalRevenue,
      thisMonth: stats.thisMonth,
      pending: stats.pending,
      transactions: stats.transactions
    });
  } catch (err) {
    logger.error({ err }, 'Payments page error');
    res.render('admin/error', { error: 'Failed to load payments', token: res.locals.token, branding: null, basePath });
  }
});

export default router;

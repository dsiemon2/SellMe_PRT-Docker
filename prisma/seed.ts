import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // App Configuration
  // Keywords that explicitly confirm intent to purchase - NOT generic affirmatives
  const successKeywordsArray = [
    // === DIRECT PURCHASE STATEMENTS ===
    'i\'ll buy it', 'i\'ll buy one', 'i\'ll buy the pen', 'i will buy', 'i will buy it',
    'i\'m buying', 'i\'m buying it', 'i\'m buying one', 'i\'m gonna buy',
    'i want to buy', 'i\'d like to buy', 'i would like to buy', 'let me buy',
    'i\'ll purchase', 'i\'ll purchase one', 'i want to purchase',

    // === TAKE/GET STATEMENTS ===
    'i\'ll take it', 'i\'ll take one', 'i\'ll take the pen', 'i will take it',
    'i\'ll get it', 'i\'ll get one', 'i\'ll get the pen', 'i will get one',
    'i\'ll have it', 'i\'ll have one', 'give me one', 'give me the pen',
    'i\'ll grab one', 'let me get one', 'let me have one',

    // === ORDER/RESERVE STATEMENTS ===
    'order one', 'order me one', 'order me a pen', 'order it for me',
    'put one aside', 'set one aside', 'hold one for me', 'save one for me',
    'reserve one', 'reserve it', 'reserve it for me', 'reserve the pen',
    'place the order', 'place my order', 'submit the order',

    // === PAYMENT/TRANSACTION ===
    'take my money', 'shut up and take my money', 'here\'s my money',
    'where do i pay', 'how do i pay', 'how much do i owe', 'what do i owe',
    'ring it up', 'ring me up', 'wrap it up', 'bag it up',
    'i\'ll pay now', 'i\'ll pay for it', 'let me pay', 'ready to pay',
    'charge me', 'charge my card', 'put it on my card',

    // === SOLD/CONVINCED ===
    'sold', 'i\'m sold', 'you sold me', 'consider me sold',
    'you convinced me', 'you got me', 'you win', 'you\'ve convinced me',
    'i\'m convinced', 'that convinced me',

    // === AGREEMENT/COMMITMENT ===
    'sign me up', 'where do i sign', 'i\'m in', 'count me in',
    'deal', 'you got a deal', 'it\'s a deal', 'we have a deal',
    'done', 'done deal', 'let\'s do it', 'let\'s make it happen',
    'make it happen', 'hook me up', 'set me up',

    // === YES + PURCHASE CONTEXT ===
    'yes i\'ll buy', 'yes i\'ll take', 'yes i want it', 'yes i want one',
    'yes please', 'yes order one', 'yes put one aside', 'yes reserve',
    'yeah i\'ll buy', 'yeah i\'ll take', 'yeah i want one',
    'sure i\'ll buy', 'sure i\'ll take', 'sure i want one',
    'ok i\'ll buy', 'ok i\'ll take', 'okay i\'ll get one',
    'fine i\'ll buy', 'fine i\'ll take', 'alright i\'ll buy',

    // === EXPLICIT CONFIRMATION RESPONSES ===
    // These are responses to "Would you like to order?" or "Can I put one aside?"
    'yes please', 'yes do it', 'yes order it', 'yes order one',
    'yes put one aside', 'yes reserve it', 'yes i\'d like that',
    'please do', 'go ahead', 'go for it', 'do it',
    'yes you can', 'yes go ahead', 'that would be great',

    // === ENTHUSIASM (only after being asked) ===
    'hell yes', 'heck yes', 'absolutely yes', 'definitely yes',
    'can\'t say no to that', 'you twisted my arm',

    // === QUANTITY SPECIFIC ===
    'give me two', 'i\'ll take two', 'i want two', 'make it two',
    'i\'ll buy two', 'order me two', 'i\'ll get a couple'
  ];

  // Keywords that explicitly decline to purchase - NOT generic negatives
  const objectionKeywordsArray = [
    // === DIRECT REFUSALS (contraction + full form) ===
    'don\'t want it', 'do not want it', 'don\'t want one', 'do not want one',
    'don\'t want the pen', 'do not want the pen', 'don\'t want to buy', 'do not want to buy',
    'i won\'t buy', 'i will not buy', 'won\'t buy it', 'will not buy it',
    'not buying', 'i\'m not buying', 'i am not buying', 'not gonna buy',
    'refuse to buy', 'i refuse to buy', 'won\'t be buying', 'will not be buying',

    // === NOT FOR ME ===
    'not for me', 'isn\'t for me', 'is not for me', 'it\'s not for me',
    'this isn\'t for me', 'this is not for me', 'the pen isn\'t for me',
    'that\'s not for me', 'that is not for me', 'just not for me',
    'this pen isn\'t for me', 'this pen is not for me',

    // === POLITE DECLINES ===
    'no thanks', 'no thank you', 'no but thanks', 'thanks but no',
    'i\'ll pass', 'i will pass', 'i\'m gonna pass', 'gonna pass',
    'pass on this', 'pass on the pen', 'i\'ll have to pass',
    'i\'m good', 'i\'m fine', 'i\'m okay', 'i\'m all set',
    'i\'m good thanks', 'no i\'m good', 'i think i\'m good',

    // === NOT INTERESTED ===
    'not interested', 'i\'m not interested', 'i am not interested',
    'doesn\'t interest me', 'does not interest me', 'not my thing',
    'not really interested', 'not that interested',

    // === DON\'T NEED ===
    'don\'t need it', 'do not need it', 'don\'t need one', 'do not need one',
    'don\'t need the pen', 'do not need the pen', 'don\'t need a pen',
    'i don\'t need it', 'i do not need it', 'don\'t really need',
    'no need', 'have no need', 'i have no need',

    // === STRONG REFUSALS ===
    'absolutely not', 'definitely not', 'certainly not', 'no way',
    'hell no', 'heck no', 'nope', 'nah', 'never',
    'forget it', 'forget about it', 'not happening', 'not gonna happen',
    'i refuse', 'i decline', 'hard pass', 'hard no',
    'no chance', 'not a chance', 'no way in hell',

    // === PRICE OBJECTIONS (as final answer) ===
    'too expensive', 'way too expensive', 'too much', 'too much money',
    'can\'t afford', 'cannot afford', 'can\'t afford it', 'cannot afford it',
    'out of my budget', 'over my budget', 'beyond my budget',
    'not worth it', 'not worth the money', 'not worth the price',
    'waste of money', 'waste my money', 'too pricey', 'too rich for me',

    // === NEGATIVE DEAL LANGUAGE ===
    'no deal', 'deal\'s off', 'deal is off', 'the deal is off',
    'not a deal', 'can\'t do the deal', 'cannot make this deal',

    // === CHANGED MIND / WALKING AWAY ===
    'i changed my mind', 'i\'ve changed my mind', 'changed my mind',
    'never mind', 'nevermind', 'forget i asked',
    'i\'m done', 'we\'re done', 'i\'m out', 'count me out',
    'i\'m leaving', 'i\'ll leave', 'goodbye', 'i\'m walking away',

    // === NOT TODAY / NOT NOW (as final answer) ===
    'not today', 'not now', 'not right now', 'maybe another time',
    'some other time', 'another day', 'not this time',

    // === ALREADY HAVE / DON\'T USE ===
    'i have a pen', 'i already have', 'already have one', 'got one already',
    'i have enough pens', 'don\'t use pens', 'i don\'t write',

    // === MISC REJECTIONS ===
    'i said no', 'the answer is no', 'my answer is no', 'still no',
    'i\'m saying no', 'that\'s a no', 'that is a no', 'it\'s a no from me',
    'no can do', 'not happening today', 'ain\'t buying', 'ain\'t gonna buy'
  ];

  await prisma.appConfig.upsert({
    where: { id: 'default' },
    update: {
      successKeywords: JSON.stringify(successKeywordsArray),
      objectionKeywords: JSON.stringify(objectionKeywordsArray)
    },
    create: {
      id: 'default',
      appName: 'AI Sales Training - Prairie Rose Trading',
      greeting: 'Welcome to Prairie Rose Trading! When you\'re ready, just say "Show me your hats" or "Sell me some boots" to begin your western ware training session.',
      triggerPhrase: 'sell me some boots',
      selectedVoice: 'alloy',
      aiPersona: 'friendly, knowledgeable western wear specialist who understands ranch life and cowboy culture',
      successKeywords: JSON.stringify(successKeywordsArray),
      objectionKeywords: JSON.stringify(objectionKeywordsArray),
      maxClosingAttempts: 3
    }
  });

  // Western Ware Product (using PenProduct model for compatibility)
  await prisma.penProduct.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Stetson Rancher Hat',
      tagline: 'The Crown of the West',
      basePrice: 189.99,
      premiumPrice: 399.99,
      features: JSON.stringify([
        '100% pure beaver felt construction',
        'Hand-shaped by master hatmakers',
        'Moisture-wicking sweatband',
        'Crushable design for travel',
        'Custom creasing available',
        'Lifetime reshaping service'
      ]),
      benefits: JSON.stringify([
        'Authentic western heritage and craftsmanship',
        'Protects from sun, rain, and wind',
        'Comfortable all-day wear',
        'Makes a lasting impression at rodeos and cattle drives',
        'Investment piece that lasts generations'
      ]),
      variants: JSON.stringify([
        'Cattleman Black',
        'Buckskin Tan',
        'Silver Belly',
        'Chocolate Brown'
      ]),
      scarcityMessage: 'Hand-crafted - only 12 remain in this style'
    }
  });

  // Discovery Questions - Western Ware focused
  const discoveryQuestions = [
    {
      question: 'What brings you into western wear - ranch work, rodeo, or just love the lifestyle?',
      purpose: 'Identifies primary use case and lifestyle',
      followUp: 'How long have you been involved in that?',
      targetNeed: 'authenticity'
    },
    {
      question: 'Do you value durability, style, or comfort more in your western wear?',
      purpose: 'Reveals primary purchase driver',
      followUp: 'Tell me more about why that matters to you.',
      targetNeed: 'durability'
    },
    {
      question: 'What does your current hat or boots say about you?',
      purpose: 'Opens discussion about personal image',
      followUp: 'Is that the impression you want to make at the next rodeo?',
      targetNeed: 'status'
    },
    {
      question: 'How much time do you spend outdoors - on the ranch, trail, or arena?',
      purpose: 'Establishes need for quality outdoor gear',
      followUp: 'What kind of conditions do you face most?',
      targetNeed: 'durability'
    },
    {
      question: 'Have you ever had a boot or hat fail you when you needed it most?',
      purpose: 'Creates pain point awareness',
      followUp: 'That must have been frustrating - what happened?',
      targetNeed: 'reliability'
    },
    {
      question: 'Are you looking for everyday working gear or something special for events?',
      purpose: 'Identifies occasion and price range',
      followUp: 'What kind of events do you attend?',
      targetNeed: 'occasion'
    },
    {
      question: 'If you could describe your ideal western look in three words, what would they be?',
      purpose: 'Direct preference gathering',
      followUp: null,
      targetNeed: 'style'
    }
  ];

  for (let i = 0; i < discoveryQuestions.length; i++) {
    await prisma.discoveryQuestion.upsert({
      where: { id: `discovery-${i}` },
      update: discoveryQuestions[i],
      create: { id: `discovery-${i}`, ...discoveryQuestions[i], sortOrder: i }
    });
  }

  // Positioning Angles - Western Ware focused
  const positioningAngles = [
    {
      userNeed: 'authenticity',
      headline: 'The Real Deal',
      pitch: 'When you walk into that arena or ranch, people can tell the difference between someone who lives the lifestyle and someone who just bought a costume. This is gear made by and for real cowboys.',
      emotionalHook: 'Picture yourself walking in with gear that says you belong...'
    },
    {
      userNeed: 'durability',
      headline: 'Built for the Long Haul',
      pitch: 'Crafted to handle whatever the trail throws at you. Rain, dust, sun - this gear won\'t let you down when you\'re miles from the barn.',
      emotionalHook: 'Imagine gear that works as hard as you do...'
    },
    {
      userNeed: 'style',
      headline: 'Stand Out in the Crowd',
      pitch: 'Western wear isn\'t just clothing - it\'s a statement. This piece will turn heads at the rodeo and get compliments at every event.',
      emotionalHook: 'See yourself making an entrance they won\'t forget...'
    },
    {
      userNeed: 'occasion',
      headline: 'Dress for the Moment',
      pitch: 'Whether it\'s a championship rodeo or a Saturday night dance, having the right gear makes all the difference. This is investment dressing for those moments that matter.',
      emotionalHook: 'Experience the confidence of being perfectly dressed for the occasion...'
    },
    {
      userNeed: 'status',
      headline: 'Ride with the Best',
      pitch: 'This isn\'t mass-produced fashion - it\'s what champion ropers and working ranchers choose. When you wear this, you\'re wearing a legacy.',
      emotionalHook: 'What does your gear say about your place in the western world?'
    },
    {
      userNeed: 'gift',
      headline: 'A Gift That Lasts Generations',
      pitch: 'Quality western wear gets better with age and carries stories. This is a gift they\'ll treasure, use daily, and maybe pass down someday.',
      emotionalHook: 'Give them something that shows you truly understand their passion...'
    }
  ];

  for (const angle of positioningAngles) {
    await prisma.positioningAngle.upsert({
      where: { userNeed: angle.userNeed },
      update: angle,
      create: angle
    });
  }

  // Sales Techniques
  const salesTechniques = [
    // Discovery
    { name: 'open_ended_questions', category: 'discovery', description: 'Ask questions that require more than yes/no answers', script: 'Tell me about... What does... How do you feel about...', enabled: true },
    { name: 'active_listening', category: 'discovery', description: 'Reflect back what the customer says to show understanding', script: 'So what I\'m hearing is... That\'s interesting because...', enabled: true },
    { name: 'pain_point_discovery', category: 'discovery', description: 'Uncover frustrations with current solutions', script: 'What frustrates you most about... Has that ever caused...', enabled: true },

    // Positioning
    { name: 'benefit_selling', category: 'positioning', description: 'Focus on benefits, not features', script: 'This means you\'ll be able to... The result is...', enabled: true },
    { name: 'storytelling', category: 'positioning', description: 'Use stories to make the product relatable', script: 'I had a client who... They told me...', enabled: true },
    { name: 'social_proof', category: 'positioning', description: 'Reference others who made the same choice', script: 'Executives at Fortune 500 companies choose this... Our most successful clients...', enabled: true },

    // Persuasion
    { name: 'scarcity', category: 'persuasion', description: 'Limited availability creates urgency', script: 'Only X remain... Limited edition... While supplies last...', enabled: true },
    { name: 'urgency', category: 'persuasion', description: 'Time-sensitive opportunity', script: 'I can reserve one for you now... Today only...', enabled: true },
    { name: 'authority', category: 'persuasion', description: 'Reference experts and leaders', script: 'Used by executives and creators... Award-winning design...', enabled: true },
    { name: 'contrast', category: 'persuasion', description: 'Compare to show value', script: 'For less than a dinner out, you get lifetime quality...', enabled: true },
    { name: 'future_pacing', category: 'persuasion', description: 'Help them visualize ownership', script: 'Picture yourself... Imagine walking into... See yourself...', enabled: true },

    // Closing
    { name: 'assumptive_close', category: 'closing', description: 'Assume the sale and discuss details', script: 'Would you prefer the matte black or brushed silver?', enabled: true },
    { name: 'summary_close', category: 'closing', description: 'Summarize benefits before asking', script: 'So you\'re getting X, Y, and Z - shall we get you set up?', enabled: true },
    { name: 'choice_close', category: 'closing', description: 'Give options that both result in a sale', script: 'Would you like one or two? The standard or premium?', enabled: true },

    // Objection Handling
    { name: 'feel_felt_found', category: 'objection_handling', description: 'Empathize, relate, resolve', script: 'I understand how you feel. Others have felt the same way. What they found was...', enabled: true },
    { name: 'reframe', category: 'objection_handling', description: 'Change the perspective on the objection', script: 'That\'s exactly why... Actually, that\'s the best part...', enabled: true },
    { name: 'isolate', category: 'objection_handling', description: 'Confirm this is the only objection', script: 'If we could solve that, would you be ready to move forward?', enabled: true }
  ];

  for (let i = 0; i < salesTechniques.length; i++) {
    await prisma.salesTechnique.upsert({
      where: { name: salesTechniques[i].name },
      update: salesTechniques[i],
      create: { ...salesTechniques[i], sortOrder: i }
    });
  }

  // Closing Strategies - ALL must ASK for confirmation, never assume!
  const closingStrategies = [
    {
      name: 'choice_close',
      type: 'choice',
      script: 'Which finish speaks to you more - the matte black or the brushed silver? And would you like me to put one aside for you?',
      useWhen: 'Customer has shown interest in the product'
    },
    {
      name: 'summary_close',
      type: 'soft',
      script: 'Based on what you\'ve told me - you want something reliable, professional, and distinctive. This pen checks every box. Would you like me to set one aside for you?',
      useWhen: 'After discovery phase reveals clear needs'
    },
    {
      name: 'urgency_close',
      type: 'urgency',
      script: 'I should mention - we only have a handful left in this finish. Would you like me to reserve one before they\'re gone?',
      useWhen: 'Customer is interested but hesitating'
    },
    {
      name: 'quantity_close',
      type: 'direct',
      script: 'How many would you like to order? Just one, or would you like a couple?',
      useWhen: 'Customer has expressed they want one'
    },
    {
      name: 'direct_ask',
      type: 'direct',
      script: 'Would you like to place an order today? I can have one ready for you.',
      useWhen: 'After addressing all objections'
    },
    {
      name: 'reservation_close',
      type: 'soft',
      script: 'Can I put one aside for you? No obligation, just want to make sure you don\'t miss out.',
      useWhen: 'Customer seems interested but non-committal'
    }
  ];

  for (const strategy of closingStrategies) {
    await prisma.closingStrategy.upsert({
      where: { name: strategy.name },
      update: strategy,
      create: strategy
    });
  }

  // Objection Handlers - Western Ware focused
  const objectionHandlers = [
    {
      objection: 'too expensive',
      category: 'price',
      response: 'I hear you - quality western wear is an investment. But think about this: cheap boots fall apart in a season, and you end up buying three pairs to get one good year. This piece will last you a decade or more, costs pennies per wear, and actually gets better with age. Cowboys and ranchers have known this for generations.',
      technique: 'reframe'
    },
    {
      objection: 'i already have boots',
      category: 'need',
      response: 'I bet you do - and I\'m not saying to throw them out. But tell me, do your current boots still have that comfort they had on day one? Do they still look sharp at events? Sometimes having the right pair for the right occasion makes all the difference. Working boots and show boots serve different purposes.',
      technique: 'reframe'
    },
    {
      objection: 'let me think about it',
      category: 'timing',
      response: 'Absolutely, partner - I respect that. Quick question though: what specifically would you be mulling over? Is it the investment, the fit, or just whether it\'s the right style? Because if I can help with that now, might save you a trip back.',
      technique: 'isolate'
    },
    {
      objection: 'not interested',
      category: 'need',
      response: 'I understand - and honestly, I get that a lot until folks actually try things on. Before you head out, can I just ask: what kind of western wear are you using now? I\'m curious what you\'re comparing to.',
      technique: 'feel_felt_found'
    },
    {
      objection: 'i can get this cheaper online',
      category: 'competition',
      response: 'You sure can find cheaper options online. But here\'s the thing: western wear needs to fit right, and you can\'t try on a website. Plus, we stand behind everything we sell with lifetime repairs and reshaping. When that online hat arrives looking like a pizza box sat on it, who do you call? We\'re here for you.',
      technique: 'reframe'
    }
  ];

  for (let i = 0; i < objectionHandlers.length; i++) {
    await prisma.objectionHandler.upsert({
      where: { id: `objection-${i}` },
      update: objectionHandlers[i],
      create: { id: `objection-${i}`, ...objectionHandlers[i] }
    });
  }

  // AI Prompt Configuration - Western Ware focused
  const systemPrompt = `You are a friendly, knowledgeable western wear sales specialist at Prairie Rose Trading. Your goal is to help customers find the perfect cowboy hats, boots, belt buckles, and western apparel.

LANGUAGE RULE:
- Respond in whatever language the customer uses
- If they speak Spanish, respond in Spanish
- Translate product names and western terminology naturally
- The trigger phrase works in any language (e.g., "sell me some boots", "véndeme unas botas")

IMPORTANT RULES:
- NEVER start by pitching products directly
- ALWAYS begin with discovery questions to understand their needs
- Learn if they're working cowboys, rodeo competitors, or western lifestyle enthusiasts
- Adapt your recommendations based on what you learn
- Be friendly, authentic, and knowledgeable about western culture
- Handle objections gracefully with cowboy wisdom

CRITICAL CLOSING RULE - NEVER ASSUME THE SALE:
- When the customer expresses interest (e.g., "I like those", "sounds good"), do NOT assume they are buying
- You MUST ask an explicit closing question to confirm the purchase:
  * "Would you like me to set that pair aside for you?"
  * "Can I box those up for you?"
  * "Ready to make them yours?"
  * "Want me to start the fitting process?"
  * "Should I ring those up?"
- Wait for their explicit YES before celebrating the sale
- Interest is NOT the same as commitment - always ask for the order!

YOUR PERSONALITY:
- Friendly and authentic western character
- Genuinely knowledgeable about ranch life and rodeo culture
- Patient and helpful - never pushy
- Uses appropriate western phrases naturally
- Respects the customer's time and decision

SALES PHASES:
1. DISCOVERY: Learn about their lifestyle, needs, and preferences
2. POSITIONING: Match products to their specific use case
3. PRESENTATION: Share benefits, craftsmanship, and value
4. HANDLING OBJECTIONS: Address concerns with understanding
5. CLOSING: Ask for the order explicitly - never assume!

Remember: Cowboys appreciate authenticity and straight talk. Help them find what they need, not what you want to sell!`;

  const closingPrompt = 'ALWAYS ask for the order explicitly - never assume! Use questions like "Want me to box those up?", "Ready to make them yours?", "Should I ring those up?". Wait for explicit confirmation before celebrating. Maximum 3 closing attempts before gracefully accepting.';

  await prisma.aIPromptConfig.upsert({
    where: { name: 'default' },
    update: {
      systemPrompt: systemPrompt,
      closingPrompt: closingPrompt
    },
    create: {
      name: 'default',
      systemPrompt: systemPrompt,
      discoveryPrompt: 'Focus on understanding the customer. Ask about their lifestyle - do they work on a ranch, compete in rodeo, or just love western culture? Learn about their needs for durability, style, and comfort.',
      positioningPrompt: 'Based on what you\'ve learned, recommend western wear that fits their lifestyle. Emphasize craftsmanship, durability, and authenticity.',
      closingPrompt: closingPrompt,
      enabled: true
    }
  });

  // ============================================
  // LANGUAGES - All 24 languages (EXACTLY from CLAUDE.md)
  // ============================================
  const languages = [
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', enabled: true },
    { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文', enabled: true },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', enabled: true },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', enabled: true },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', enabled: true },
    { code: 'en', name: 'English', nativeName: 'English', enabled: true },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', enabled: true },
    { code: 'fr', name: 'French', nativeName: 'Français', enabled: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: true },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', enabled: true },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', enabled: true },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', enabled: true },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', enabled: true },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', enabled: true },
    { code: 'ko', name: 'Korean', nativeName: '한국어', enabled: true },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', enabled: true },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', enabled: true },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', enabled: true },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', enabled: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', enabled: true },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', enabled: true },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', enabled: true },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', enabled: true },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', enabled: true }
  ];

  // Clear existing languages and seed fresh
  await prisma.language.deleteMany({});
  for (const lang of languages) {
    await prisma.language.create({ data: lang });
  }
  console.log(`Seeded ${languages.length} languages`);

  // ============================================
  // BRANDING - Western Brown Theme
  // ============================================
  await prisma.branding.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#b45309', // Western Brown/Amber
      secondaryColor: '#92400e',
      accentColor: '#d97706',
      headingFont: 'Inter',
      bodyFont: 'Inter'
    }
  });
  console.log('Seeded Branding with Western Brown theme');

  // ============================================
  // STORE INFO - SellMe PRT
  // ============================================
  await prisma.storeInfo.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      businessName: 'SellMe PRT',
      tagline: 'Western Sales Training',
      description: 'AI-powered western wear sales training platform',
      address: '',
      phone: '',
      email: '',
      website: '',
      businessHours: '',
      timezone: 'America/New_York'
    }
  });
  console.log('Seeded StoreInfo');

  // ============================================
  // FEATURES - Western Brown theme colors
  // ============================================
  await prisma.features.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      faqEnabled: false,
      stickyBarEnabled: false,
      stickyBarText: '',
      stickyBarBgColor: '#b45309',
      stickyBarLink: '',
      stickyBarLinkText: '',
      liveChatEnabled: false,
      chatProvider: 'builtin',
      chatWelcomeMessage: 'Howdy! How can we help you today?',
      chatAgentName: 'Support',
      chatWidgetColor: '#b45309',
      chatPosition: 'bottom-right',
      chatShowOnMobile: true,
      chatWidgetId: '',
      chatEmbedCode: '',
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: false,
      orderConfirmations: true,
      marketingEmails: false,
      appointmentReminders: true,
      facebookUrl: '',
      twitterUrl: '',
      instagramUrl: '',
      linkedinUrl: '',
      youtubeUrl: '',
      tiktokUrl: '',
      shareOnFacebook: true,
      shareOnTwitter: true,
      shareOnLinkedin: false,
      shareOnWhatsapp: true,
      shareOnEmail: true,
      copyLinkButton: true
    }
  });
  console.log('Seeded Features');

  // ============================================
  // PAYMENT SETTINGS
  // ============================================
  await prisma.paymentSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      enabled: false,
      stripeEnabled: false,
      stripePublishableKey: '',
      stripeTestMode: true,
      paypalEnabled: false,
      paypalClientId: '',
      paypalSandbox: true,
      squareEnabled: false,
      squareAppId: '',
      squareSandbox: true
    }
  });
  console.log('Seeded PaymentSettings');

  // ============================================
  // SAMPLE COMPANY
  // ============================================
  const company = await prisma.company.upsert({
    where: { domain: 'prairierose.example.com' },
    update: {},
    create: {
      name: 'Prairie Rose Trading Co.',
      domain: 'prairierose.example.com',
      settings: '{}',
      isActive: true
    }
  });
  console.log('Seeded Company');

  // ============================================
  // SAMPLE USER
  // ============================================
  await prisma.user.upsert({
    where: { email_companyId: { email: 'admin@prairierose.example.com', companyId: company.id } },
    update: {},
    create: {
      email: 'admin@prairierose.example.com',
      username: 'admin',
      password: 'admin123',
      name: 'Ranch Admin',
      role: 'COMPANY_ADMIN',
      companyId: company.id
    }
  });
  console.log('Seeded User');

  // ============================================
  // SMS SETTINGS (Default)
  // ============================================
  await prisma.sMSSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      provider: 'twilio',
      accountSid: '',
      authToken: '',
      fromNumber: '',
      enableReminders: true,
      reminderHours: 24,
      isActive: false
    }
  });
  console.log('Seeded SMS Settings');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Voice Command Parser - Natural Language Processing for EarnNest transactions

export class VoiceCommandParser {
  constructor() {
    // Wake word patterns
    this.wakeWords = ['hey earnest', 'earnest', 'hey earn nest', 'earn nest'];
    
    // Transaction type patterns
    this.incomePatterns = [
      /\b(earned|made|got|received|income|salary|freelance|tutoring)\b/i,
      /\b(add income|record income|log income)\b/i,
      /\b(i (earned|made|got|received))\b/i
    ];
    
    this.expensePatterns = [
      /\b(spent|paid|bought|expense|cost|purchase)\b/i,
      /\b(add expense|record expense|log expense)\b/i,
      /\b(i (spent|paid|bought))\b/i
    ];

    // Amount patterns - Indian context
    this.amountPatterns = [
      /₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, // ₹500, ₹1,000.50
      /(\d+(?:,\d+)*(?:\.\d+)?)\s*rupees?/gi, // 500 rupees, 1000 rupees
      /(\d+(?:,\d+)*(?:\.\d+)?)\s*rs\.?/gi, // 500 rs, 1000 rs.
      /\b(\d+(?:,\d+)*(?:\.\d+)?)\b/g // Plain numbers
    ];

    // Text to number conversion for spoken amounts
    this.textNumbers = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
      'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
      'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000, 'lakh': 100000,
      'crore': 10000000
    };

    // Category mappings - flexible matching
    this.categoryMappings = {
      // Income categories
      income: {
        'salary': ['salary', 'job', 'work', 'office', 'employment'],
        'freelance': ['freelance', 'freelancing', 'contract', 'project', 'gig', 'client work'],
        'tutoring': ['tutoring', 'teaching', 'tuition', 'classes', 'lessons', 'coaching'],
        'side hustle': ['side hustle', 'hustle', 'side business', 'part time', 'extra income'],
        'scholarship': ['scholarship', 'grant', 'award', 'fellowship', 'stipend'],
        'other': ['other', 'misc', 'miscellaneous', 'bonus', 'gift', 'refund']
      },
      // Expense categories  
      expense: {
        'food': ['food', 'eating', 'restaurant', 'meal', 'lunch', 'dinner', 'breakfast', 'snack', 'cafe'],
        'transportation': ['transport', 'uber', 'cab', 'taxi', 'bus', 'train', 'metro', 'auto', 'petrol', 'fuel'],
        'books': ['book', 'books', 'textbook', 'novel', 'study material', 'notes', 'stationery'],
        'entertainment': ['entertainment', 'movie', 'cinema', 'game', 'fun', 'party', 'event'],
        'movies': ['movies', 'cinema', 'film', 'theater', 'pvr', 'bookmyshow', 'show'],
        'rent': ['rent', 'room rent', 'house rent', 'accommodation'],
        'utilities': ['electricity', 'water', 'gas', 'internet', 'wifi', 'mobile bill', 'phone bill'],
        'shopping': ['shopping', 'clothes', 'dress', 'shirt', 'shoes', 'amazon', 'flipkart', 'online shopping'],
        'groceries': ['groceries', 'vegetables', 'fruits', 'market', 'supermarket', 'provisions'],
        'subscriptions': ['subscription', 'netflix', 'spotify', 'youtube', 'prime', 'app subscription'],
        'emergency fund': ['emergency', 'medical', 'doctor', 'hospital', 'medicine', 'urgent'],
        'other': ['other', 'misc', 'miscellaneous', 'random']
      }
    };

    // Common command templates
    this.commandTemplates = [
      // Income templates
      { pattern: /i (earned|made|got|received) .*?, (\d+|₹\d+).*? from (.*)/i, type: 'income' },
      { pattern: /(add|record|log) income .*? (\d+|₹\d+).*? from (.*)/i, type: 'income' },
      { pattern: /(\d+|₹\d+).*? income from (.*)/i, type: 'income' },
      
      // Expense templates
      { pattern: /i (spent|paid) .*? (\d+|₹\d+).*? (?:on|for) (.*)/i, type: 'expense' },
      { pattern: /(add|record|log) expense .*? (\d+|₹\d+).*? (?:on|for) (.*)/i, type: 'expense' },
      { pattern: /(\d+|₹\d+).*? (?:spent|paid) (?:on|for) (.*)/i, type: 'expense' },
    ];
  }

  // Check if transcript contains wake word
  containsWakeWord(transcript) {
    const lowercaseTranscript = transcript.toLowerCase();
    return this.wakeWords.some(wakeWord => 
      lowercaseTranscript.includes(wakeWord)
    );
  }

  // Extract wake word command (remove wake word from transcript)
  extractCommand(transcript) {
    let command = transcript.toLowerCase();
    
    for (const wakeWord of this.wakeWords) {
      command = command.replace(new RegExp(wakeWord, 'gi'), '').trim();
    }
    
    // Remove common filler words
    command = command.replace(/\b(um|uh|like|you know|actually|basically)\b/gi, '').trim();
    
    return command;
  }

  // Convert text numbers to digits
  convertTextToNumber(text) {
    let result = text.toLowerCase();
    
    // Handle compound numbers like "twenty five"
    Object.entries(this.textNumbers).forEach(([word, number]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      result = result.replace(regex, number.toString());
    });
    
    // Handle combinations like "five hundred" or "two thousand"
    result = result.replace(/(\d+)\s+hundred/g, (match, num) => (parseInt(num) * 100).toString());
    result = result.replace(/(\d+)\s+thousand/g, (match, num) => (parseInt(num) * 1000).toString());
    result = result.replace(/(\d+)\s+lakh/g, (match, num) => (parseInt(num) * 100000).toString());
    result = result.replace(/(\d+)\s+crore/g, (match, num) => (parseInt(num) * 10000000).toString());
    
    return result;
  }

  // Extract amount from transcript
  extractAmount(transcript) {
    const convertedText = this.convertTextToNumber(transcript);
    let amounts = [];
    
    // Try all amount patterns
    for (const pattern of this.amountPatterns) {
      const matches = [...convertedText.matchAll(pattern)];
      amounts.push(...matches.map(match => {
        const amountStr = match[1] || match[0];
        return parseFloat(amountStr.replace(/,/g, ''));
      }));
    }
    
    // Filter out invalid amounts and return the most reasonable one
    amounts = amounts.filter(amount => amount > 0 && amount <= 100000000); // Max 10 crores
    
    if (amounts.length === 0) return null;
    
    // Return the first valid amount found
    return amounts[0];
  }

  // Determine transaction type
  getTransactionType(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    
    // Check income patterns
    for (const pattern of this.incomePatterns) {
      if (pattern.test(lowerTranscript)) {
        return 'income';
      }
    }
    
    // Check expense patterns
    for (const pattern of this.expensePatterns) {
      if (pattern.test(lowerTranscript)) {
        return 'expense';
      }
    }
    
    // Default fallback - analyze context
    if (lowerTranscript.includes('earned') || lowerTranscript.includes('income') || 
        lowerTranscript.includes('salary') || lowerTranscript.includes('received')) {
      return 'income';
    }
    
    return 'expense'; // Default to expense if unclear
  }

  // Extract category from transcript
  extractCategory(transcript, transactionType) {
    const lowerTranscript = transcript.toLowerCase();
    const categories = this.categoryMappings[transactionType] || {};
    
    let bestMatch = null;
    let maxScore = 0;
    
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (lowerTranscript.includes(keyword.toLowerCase())) {
          // Calculate match score based on keyword length and specificity
          const score = keyword.length + (lowerTranscript.split(keyword).length - 1);
          if (score > maxScore) {
            maxScore = score;
            bestMatch = category;
          }
        }
      }
    }
    
    return bestMatch || (transactionType === 'income' ? 'other' : 'other');
  }

  // Extract description/source from transcript
  extractDescription(transcript, transactionType, category, amount) {
    let description = transcript;
    
    // Remove wake words
    description = this.extractCommand(description);
    
    // Remove transaction type indicators
    description = description.replace(/\b(earned|made|got|received|spent|paid|bought|income|expense|add|record|log)\b/gi, '');
    
    // Remove amount references
    description = description.replace(/₹\s*\d+(?:,\d+)*(?:\.\d+)?/g, '');
    description = description.replace(/\d+(?:,\d+)*(?:\.\d+)?\s*(?:rupees?|rs\.?)/gi, '');
    
    // Remove category references
    const categoryKeywords = this.categoryMappings[transactionType]?.[category] || [];
    categoryKeywords.forEach(keyword => {
      description = description.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '');
    });
    
    // Remove common prepositions and connectors
    description = description.replace(/\b(from|for|on|of|in|at|by|with|via|through|using)\b/gi, '');
    
    // Clean up and format
    description = description.replace(/\s+/g, ' ').trim();
    
    // If description is too short, create a default one
    if (description.length < 3) {
      description = transactionType === 'income' 
        ? `${category.charAt(0).toUpperCase() + category.slice(1)} income`
        : `${category.charAt(0).toUpperCase() + category.slice(1)} expense`;
    }
    
    return description;
  }

  // Main parsing function
  parseVoiceCommand(transcript) {
    if (!transcript || transcript.trim().length === 0) {
      return { success: false, error: 'No voice input detected' };
    }

    try {
      // Check if it's a wake word command
      const isWakeWordCommand = this.containsWakeWord(transcript);
      let command = isWakeWordCommand ? this.extractCommand(transcript) : transcript;
      
      if (command.length === 0) {
        return { success: false, error: 'No command found after wake word' };
      }

      // Extract transaction details
      const amount = this.extractAmount(command);
      if (!amount) {
        return { 
          success: false, 
          error: 'Could not detect amount. Please say the amount clearly (e.g., "500 rupees" or "₹500")',
          partialData: { transcript: command }
        };
      }

      const type = this.getTransactionType(command);
      const category = this.extractCategory(command, type);
      const description = this.extractDescription(command, type, category, amount);

      return {
        success: true,
        isWakeWordCommand,
        data: {
          type,
          amount,
          category,
          description,
          source: type === 'income' ? description : '',
          is_hustle_related: type === 'income' && (category === 'freelance' || category === 'side hustle'),
          originalTranscript: transcript,
          processedCommand: command,
          confidence: 'high' // We can enhance this based on matching strength
        }
      };
    } catch (error) {
      console.error('Voice command parsing error:', error);
      return { 
        success: false, 
        error: 'Failed to parse voice command. Please try again.',
        partialData: { transcript }
      };
    }
  }

  // Get suggestions for better voice commands
  getCommandSuggestions(transactionType = null) {
    const suggestions = {
      income: [
        "I earned 500 rupees from tutoring",
        "Add income 1000 rupees from freelance",
        "Record salary income 25000 rupees",
        "I got 200 rupees from side hustle"
      ],
      expense: [
        "I spent 150 rupees on food",
        "Add expense 500 rupees for shopping",
        "Paid 200 rupees for transportation",
        "Record expense 50 rupees for groceries"
      ]
    };

    if (transactionType) {
      return suggestions[transactionType] || [];
    }

    return [...suggestions.income, ...suggestions.expense];
  }
}

// Create singleton instance
export const voiceCommandParser = new VoiceCommandParser();

// Export individual functions for convenience
export const parseVoiceCommand = (transcript) => voiceCommandParser.parseVoiceCommand(transcript);
export const containsWakeWord = (transcript) => voiceCommandParser.containsWakeWord(transcript);
export const getCommandSuggestions = (type) => voiceCommandParser.getCommandSuggestions(type);

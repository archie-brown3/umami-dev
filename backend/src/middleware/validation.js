const Joi = require("joi");

/**
 * Validation middleware factory
 * Creates middleware to validate request body, query, or params
 */
const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details: errorDetails,
      });
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // Recipe validation
  recipe: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).allow(""),
    ingredients: Joi.array()
      .items(
        Joi.object({
          amount: Joi.number().positive().allow(null),
          unit: Joi.string().max(50).allow(""),
          name: Joi.string().min(1).max(200).required(),
        })
      )
      .min(1)
      .required(),
    instructions: Joi.array()
      .items(Joi.string().min(1).max(1000))
      .min(1)
      .required(),
    tags: Joi.array().items(Joi.string().max(50)).max(20),
    imageUrl: Joi.string().uri().allow(""),
    sourceUrl: Joi.string().uri().allow(""),
    cookingTime: Joi.number().integer().min(0).max(1440), // max 24 hours
    servings: Joi.number().integer().min(1).max(100),
    difficulty: Joi.string().valid("easy", "medium", "hard"),
    isPublic: Joi.boolean().default(false),
  }),

  // Recipe update (all fields optional)
  recipeUpdate: Joi.object({
    title: Joi.string().min(1).max(200),
    description: Joi.string().max(1000).allow(""),
    ingredients: Joi.array()
      .items(
        Joi.object({
          amount: Joi.number().positive().allow(null),
          unit: Joi.string().max(50).allow(""),
          name: Joi.string().min(1).max(200).required(),
        })
      )
      .min(1),
    instructions: Joi.array().items(Joi.string().min(1).max(1000)).min(1),
    tags: Joi.array().items(Joi.string().max(50)).max(20),
    imageUrl: Joi.string().uri().allow(""),
    sourceUrl: Joi.string().uri().allow(""),
    cookingTime: Joi.number().integer().min(0).max(1440),
    servings: Joi.number().integer().min(1).max(100),
    difficulty: Joi.string().valid("easy", "medium", "hard"),
    isPublic: Joi.boolean(),
  }).min(1), // At least one field must be provided

  // URL extraction
  urlExtraction: Joi.object({
    url: Joi.string().uri().required(),
  }),

  // Text analysis
  textAnalysis: Joi.object({
    text: Joi.string().min(10).max(10000).required(),
    isInstagramContent: Joi.boolean().default(false),
  }),

  // Pagination query
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(200).allow(""),
    tags: Joi.string().allow(""), // Comma-separated tags
    sortBy: Joi.string()
      .valid("createdAt", "updatedAt", "title")
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),

  // Shopping list
  shoppingList: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    items: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().min(1).max(200).required(),
          quantity: Joi.string().max(50).allow(""),
          isCompleted: Joi.boolean().default(false),
          category: Joi.string().max(100).allow(""),
        })
      )
      .default([]),
  }),

  // Meal plan
  mealPlan: Joi.object({
    weekStartDate: Joi.date().iso().required(),
    meals: Joi.array()
      .items(
        Joi.object({
          day: Joi.string()
            .valid(
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday"
            )
            .required(),
          mealType: Joi.string()
            .valid("breakfast", "lunch", "dinner", "snack")
            .required(),
          recipeId: Joi.string().uuid().required(),
          servings: Joi.number().integer().min(1).max(20).default(1),
        })
      )
      .default([]),
  }),

  // Token verification
  tokenVerification: Joi.object({
    token: Joi.string().required(),
  }),
};

module.exports = {
  validate,
  schemas,
};

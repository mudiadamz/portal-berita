/**
 * Validation Utilities
 * Joi validation schemas and helpers
 */

const Joi = require('joi');

// Common validation patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phone: /^(\+\d{1,3}[- ]?)?\d{10}$/
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(patterns.password).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
    role: Joi.string().valid('pengguna', 'jurnalis', 'admin', 'instansi').default('pengguna')
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters'
    }),
    email: Joi.string().email().messages({
      'string.email': 'Please provide a valid email address'
    }),
    role: Joi.string().valid('pengguna', 'jurnalis', 'admin', 'instansi'),
    status: Joi.string().valid('aktif', 'nonaktif')
  }).min(1)
};

// Berita validation schemas
const beritaSchemas = {
  create: Joi.object({
    judul: Joi.string().min(5).max(255).required().messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 255 characters',
      'any.required': 'Title is required'
    }),
    slug: Joi.string().min(5).max(280).pattern(/^[a-z0-9-]+$/).required().messages({
      'string.min': 'Slug must be at least 5 characters long',
      'string.max': 'Slug cannot exceed 280 characters',
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
      'any.required': 'Slug is required'
    }),
    konten: Joi.string().min(50).required().messages({
      'string.min': 'Content must be at least 50 characters long',
      'any.required': 'Content is required'
    }),
    ringkasan: Joi.string().max(1000).messages({
      'string.max': 'Summary cannot exceed 1000 characters'
    }),
    gambarUtama: Joi.string().uri().max(500).messages({
      'string.uri': 'Main image must be a valid URL',
      'string.max': 'Main image URL cannot exceed 500 characters'
    }),
    tags: Joi.array().items(Joi.string().min(2).max(50)).max(15).messages({
      'array.max': 'Maximum 15 tags allowed'
    }),
    kategoriId: Joi.number().integer().positive().required().messages({
      'number.base': 'Category ID must be a number',
      'number.integer': 'Category ID must be an integer',
      'number.positive': 'Category ID must be positive',
      'any.required': 'Category is required'
    }),
    kanalInstansiId: Joi.number().integer().positive().messages({
      'number.base': 'Institution channel ID must be a number',
      'number.integer': 'Institution channel ID must be an integer',
      'number.positive': 'Institution channel ID must be positive'
    }),
    status: Joi.string().valid('draft', 'review', 'published', 'rejected', 'archived').default('draft'),
    metaTitle: Joi.string().max(255).messages({
      'string.max': 'Meta title cannot exceed 255 characters'
    }),
    metaDescription: Joi.string().max(500).messages({
      'string.max': 'Meta description cannot exceed 500 characters'
    }),
    isFeatured: Joi.boolean().default(false),
    isBreakingNews: Joi.boolean().default(false)
  }),

  update: Joi.object({
    judul: Joi.string().min(5).max(255).messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 255 characters'
    }),
    slug: Joi.string().min(5).max(280).pattern(/^[a-z0-9-]+$/).messages({
      'string.min': 'Slug must be at least 5 characters long',
      'string.max': 'Slug cannot exceed 280 characters',
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens'
    }),
    konten: Joi.string().min(50).messages({
      'string.min': 'Content must be at least 50 characters long'
    }),
    ringkasan: Joi.string().max(1000).messages({
      'string.max': 'Summary cannot exceed 1000 characters'
    }),
    gambarUtama: Joi.string().uri().max(500).messages({
      'string.uri': 'Main image must be a valid URL',
      'string.max': 'Main image URL cannot exceed 500 characters'
    }),
    tags: Joi.array().items(Joi.string().min(2).max(50)).max(15).messages({
      'array.max': 'Maximum 15 tags allowed'
    }),
    kategoriId: Joi.number().integer().positive().messages({
      'number.base': 'Category ID must be a number',
      'number.integer': 'Category ID must be an integer',
      'number.positive': 'Category ID must be positive'
    }),
    kanalInstansiId: Joi.number().integer().positive().messages({
      'number.base': 'Institution channel ID must be a number',
      'number.integer': 'Institution channel ID must be an integer',
      'number.positive': 'Institution channel ID must be positive'
    }),
    status: Joi.string().valid('draft', 'review', 'published', 'rejected', 'archived'),
    metaTitle: Joi.string().max(255).messages({
      'string.max': 'Meta title cannot exceed 255 characters'
    }),
    metaDescription: Joi.string().max(500).messages({
      'string.max': 'Meta description cannot exceed 500 characters'
    }),
    isFeatured: Joi.boolean(),
    isBreakingNews: Joi.boolean()
  }).min(1),

  updateStatus: Joi.object({
    status: Joi.string().valid('draft', 'review', 'published', 'rejected', 'archived').required().messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be one of: draft, review, published, rejected, archived'
    })
  })
};

// Post validation schemas (legacy - keeping for backward compatibility)
const postSchemas = beritaSchemas;

// Kategori validation schemas
const kategoriSchemas = {
  create: Joi.object({
    nama: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Category name must be at least 2 characters long',
      'string.max': 'Category name cannot exceed 100 characters',
      'any.required': 'Category name is required'
    }),
    deskripsi: Joi.string().max(500).messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
    slug: Joi.string().min(2).max(120).pattern(/^[a-z0-9-]+$/).required().messages({
      'string.min': 'Slug must be at least 2 characters long',
      'string.max': 'Slug cannot exceed 120 characters',
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
      'any.required': 'Slug is required'
    }),
    isActive: Joi.boolean().default(true)
  }),

  update: Joi.object({
    nama: Joi.string().min(2).max(100).messages({
      'string.min': 'Category name must be at least 2 characters long',
      'string.max': 'Category name cannot exceed 100 characters'
    }),
    deskripsi: Joi.string().max(500).messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
    slug: Joi.string().min(2).max(120).pattern(/^[a-z0-9-]+$/).messages({
      'string.min': 'Slug must be at least 2 characters long',
      'string.max': 'Slug cannot exceed 120 characters',
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens'
    }),
    isActive: Joi.boolean()
  }).min(1)
};

// KanalInstansi validation schemas
const kanalInstansiSchemas = {
  create: Joi.object({
    nama: Joi.string().min(2).max(150).required().messages({
      'string.min': 'Institution name must be at least 2 characters long',
      'string.max': 'Institution name cannot exceed 150 characters',
      'any.required': 'Institution name is required'
    }),
    deskripsi: Joi.string().max(1000).messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
    slug: Joi.string().min(2).max(170).pattern(/^[a-z0-9-]+$/).required().messages({
      'string.min': 'Slug must be at least 2 characters long',
      'string.max': 'Slug cannot exceed 170 characters',
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
      'any.required': 'Slug is required'
    }),
    logoUrl: Joi.string().uri().max(500).messages({
      'string.uri': 'Logo URL must be a valid URL',
      'string.max': 'Logo URL cannot exceed 500 characters'
    }),
    websiteUrl: Joi.string().uri().max(500).messages({
      'string.uri': 'Website URL must be a valid URL',
      'string.max': 'Website URL cannot exceed 500 characters'
    }),
    contactEmail: Joi.string().email().max(255).messages({
      'string.email': 'Please provide a valid contact email',
      'string.max': 'Contact email cannot exceed 255 characters'
    }),
    contactPhone: Joi.string().max(20).messages({
      'string.max': 'Contact phone cannot exceed 20 characters'
    }),
    alamat: Joi.string().max(1000).messages({
      'string.max': 'Address cannot exceed 1000 characters'
    })
  }),

  update: Joi.object({
    nama: Joi.string().min(2).max(150).messages({
      'string.min': 'Institution name must be at least 2 characters long',
      'string.max': 'Institution name cannot exceed 150 characters'
    }),
    deskripsi: Joi.string().max(1000).messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
    slug: Joi.string().min(2).max(170).pattern(/^[a-z0-9-]+$/).messages({
      'string.min': 'Slug must be at least 2 characters long',
      'string.max': 'Slug cannot exceed 170 characters',
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens'
    }),
    logoUrl: Joi.string().uri().max(500).messages({
      'string.uri': 'Logo URL must be a valid URL',
      'string.max': 'Logo URL cannot exceed 500 characters'
    }),
    websiteUrl: Joi.string().uri().max(500).messages({
      'string.uri': 'Website URL must be a valid URL',
      'string.max': 'Website URL cannot exceed 500 characters'
    }),
    contactEmail: Joi.string().email().max(255).messages({
      'string.email': 'Please provide a valid contact email',
      'string.max': 'Contact email cannot exceed 255 characters'
    }),
    contactPhone: Joi.string().max(20).messages({
      'string.max': 'Contact phone cannot exceed 20 characters'
    }),
    alamat: Joi.string().max(1000).messages({
      'string.max': 'Address cannot exceed 1000 characters'
    }),
    isVerified: Joi.boolean(),
    isActive: Joi.boolean()
  }).min(1)
};

// Komentar validation schemas
const komentarSchemas = {
  create: Joi.object({
    konten: Joi.string().min(1).max(2000).required().messages({
      'string.min': 'Comment content cannot be empty',
      'string.max': 'Comment content cannot exceed 2000 characters',
      'any.required': 'Comment content is required'
    }),
    parentId: Joi.number().integer().positive().allow(null).messages({
      'number.base': 'Parent comment ID must be a number',
      'number.integer': 'Parent comment ID must be an integer',
      'number.positive': 'Parent comment ID must be positive'
    })
  }),

  update: Joi.object({
    konten: Joi.string().min(1).max(2000).messages({
      'string.min': 'Comment content cannot be empty',
      'string.max': 'Comment content cannot exceed 2000 characters'
    }),
    isApproved: Joi.boolean(),
    isReported: Joi.boolean()
  }).min(1)
};

// Bookmark validation schemas
const bookmarkSchemas = {
  create: Joi.object({
    beritaId: Joi.number().integer().positive().required().messages({
      'number.base': 'News ID must be a number',
      'number.integer': 'News ID must be an integer',
      'number.positive': 'News ID must be positive',
      'any.required': 'News ID is required'
    })
  })
};

// Query parameter validation schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('created_at', 'updated_at', 'title', 'name').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  search: Joi.object({
    q: Joi.string().min(1).max(100).messages({
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query cannot exceed 100 characters'
    }),
    category: Joi.string().min(2).max(50),
    status: Joi.string().valid('draft', 'published', 'archived'),
    author: Joi.string().min(1).max(100)
  })
};

/**
 * Validate request data against schema
 * @param {object} data - Data to validate
 * @param {object} schema - Joi schema
 * @returns {object} - Validation result
 */
const validate = (data, schema) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { isValid: false, errors, data: null };
  }
  
  return { isValid: true, errors: null, data: value };
};

module.exports = {
  userSchemas,
  postSchemas, // legacy
  beritaSchemas,
  kategoriSchemas,
  kanalInstansiSchemas,
  komentarSchemas,
  bookmarkSchemas,
  querySchemas,
  validate,
  patterns
};

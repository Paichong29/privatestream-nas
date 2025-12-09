const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation Error',
                details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
            });
        }
        res.status(500).json({ error: 'Internal Validation Error' });
    }
};

// Define Schemas
const schemas = {
    login: z.object({
        username: z.string().min(1, "Username required"),
        password: z.string().min(1, "Password required")
    }),
    changePassword: z.object({
        userId: z.string().min(1),
        oldPassword: z.string().min(1),
        newPassword: z.string().min(8, "New password must be at least 8 chars")
            .regex(/[A-Z]/, "Must contain Uppercase")
            .regex(/[a-z]/, "Must contain Lowercase")
            .regex(/[0-9]/, "Must contain Number")
    }),
    createUser: z.object({
        username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Alphanumeric only"),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(['ADMIN', 'VIEWER']).optional()
    })
};

module.exports = { validate, schemas };

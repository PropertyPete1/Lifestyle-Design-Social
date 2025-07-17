"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateToken = exports.generateToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const generateToken = (userId, email) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is required for production');
    }
    const payload = {
        userId,
        id: userId,
        email,
    };
    return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
};
exports.generateToken = generateToken;
const authenticateToken = (req, res, next) => {
    let token = req.header('x-auth-token');
    if (!token && req.header('authorization')) {
        const authHeader = req.header('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    if (!token) {
        res.status(401).json({ error: 'No token, authorization denied' });
        return;
    }
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is required for production');
        }
        const decoded = jwt.verify(token, jwtSecret);
        req.user = {
            id: decoded.userId || decoded.id,
            userId: decoded.userId || decoded.id,
            email: decoded.email,
            iat: decoded.iat,
            exp: decoded.exp,
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Token is not valid' });
        return;
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = (req, _res, next) => {
    let token = req.header('x-auth-token');
    if (!token && req.header('authorization')) {
        const authHeader = req.header('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    if (token) {
        try {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error('JWT_SECRET environment variable is required for production');
            }
            const decoded = jwt.verify(token, jwtSecret);
            req.user = {
                id: decoded.userId || decoded.id,
                userId: decoded.userId || decoded.id,
                email: decoded.email,
                iat: decoded.iat,
                exp: decoded.exp,
            };
        }
        catch (error) {
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map
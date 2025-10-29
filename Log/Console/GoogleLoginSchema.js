import mongoose from 'mongoose';

const googleLoginSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true,
        unique: true
    },
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    picture: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
});

// Atualizar lastLogin antes de salvar
googleLoginSchema.pre('save', function(next) {
    this.lastLogin = new Date();
    next();
});

export default mongoose.model('GoogleLogin', googleLoginSchema);
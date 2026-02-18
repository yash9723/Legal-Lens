import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysis extends Document {
    userId: mongoose.Types.ObjectId;
    fileName: string;
    fileType: 'text' | 'image';
    content: string; // Original content or derived text
    result: any; // The full JSON analysis result
    previewText?: string;
    createdAt: Date;
}

const AnalysisSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['text', 'image'], required: true },
    content: { type: String },
    result: { type: Schema.Types.Mixed, required: true },
    previewText: { type: String },
}, {
    timestamps: true
});

export default mongoose.model<IAnalysis>('Analysis', AnalysisSchema);

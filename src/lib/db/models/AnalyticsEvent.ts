import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsEvent extends Document {
    anon_user_id: string;
    event_name: string;
    timestamp: Date;
    metadata?: {
        country?: string;
        device?: string;
        browser?: string;
        path?: string;
    };
}

const AnalyticsEventSchema: Schema = new Schema({
    anon_user_id: { type: String, required: true, index: true },
    event_name: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: {
        country: String,
        device: String,
        browser: String,
        path: String,
    },
}, {
    expireAfterSeconds: 31536000, // Optional: Auto-delete after 1 year for privacy
});

// Prevent recompilation
const AnalyticsEvent: Model<IAnalyticsEvent> =
    mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);

export default AnalyticsEvent;

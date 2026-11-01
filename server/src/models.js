import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const T = { timestamps: true };
const ref = (m) => ({ type: Schema.Types.ObjectId, ref: m });

export const User = model('User', new Schema({
  name: String, email: { type: String, unique: true, lowercase: true, required: true }, password: { type: String, required: true },
  role: { type: String, enum: ['student', 'mentor', 'college', 'admin'], required: true }, phone: String,
  profile: { college: String, degree: String, branch: String, gradYear: Number, skills: [String], interests: [String], targetRole: String, linkedin: String, github: String, resume: String },
  mentor: { company: String, title: String, years: Number, specialization: String, expertise: String, linkedin: String, photo: String, rate: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' } },
  college: ref('College'), isSample: Boolean,
}, T));

export const College = model('College', new Schema({
  name: String, university: String, email: String, phone: String, address: String, website: String, officer: String, strength: Number,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, owner: ref('User'),
  subscription: { plan: String, validTill: Date }, isSample: Boolean,
}, T));

const round = new Schema({ order: Number, name: String, description: String, duration: Number, instructions: String, criteria: String,
  passingScore: { type: Number, default: 50 }, kind: { type: String, enum: ['mcq', 'interview'], default: 'mcq' },
  topics: [String], questionCount: Number, interviewType: { type: String, enum: ['technical', 'hr'] } }, { _id: false });
export const Drive = model('Drive', new Schema({ title: String, description: String, eligibility: String, price: { type: Number, default: 0 },
  published: { type: Boolean, default: false }, rounds: [round] }, T));

export const Question = model('Question', new Schema({ topic: { type: String, index: true }, text: String, options: [String], correct: [Number],
  points: { type: Number, default: 1 }, isSample: Boolean }, T));

export const Enrollment = model('Enrollment', new Schema({ student: { ...ref('User'), index: true }, drive: ref('Drive'),
  rounds: [{ order: Number, status: { type: String, enum: ['locked', 'open', 'passed', 'failed'] }, score: Number, attempts: { type: Number, default: 0 }, _id: false }],
  overall: Number, level: String, completedAt: Date }, T).index({ student: 1, drive: 1 }, { unique: true }));

export const Attempt = model('Attempt', new Schema({ enrollment: ref('Enrollment'), student: ref('User'), order: Number, questions: [ref('Question')],
  startedAt: Date, endsAt: Date, submittedAt: Date, score: Number, topicScores: Schema.Types.Mixed, answers: Schema.Types.Mixed }, T));

export const Slot = model('Slot', new Schema({ mentor: { ...ref('User'), index: true }, start: Date, end: Date, booked: { type: Boolean, default: false } }, T));

export const Booking = model('Booking', new Schema({ student: ref('User'), mentor: ref('User'), slot: { ...ref('Slot'), unique: true, sparse: true }, enrollment: ref('Enrollment'),
  order: Number, price: { type: Number, default: 0 }, meetingUrl: String,
  status: { type: String, enum: ['awaiting_payment', 'requested', 'accepted', 'rejected', 'cancelled', 'completed'], default: 'requested' } }, T));

export const Evaluation = model('Evaluation', new Schema({ booking: { ...ref('Booking'), unique: true }, enrollment: ref('Enrollment'), student: ref('User'), mentor: ref('User'),
  type: String, scores: Schema.Types.Mixed, total: Number, feedback: String, strengths: String, weaknesses: String, recommendations: String,
  categoryNotes: Schema.Types.Mixed }, T));

export const Certificate = model('Certificate', new Schema({ certId: { type: String, unique: true }, student: ref('User'), drive: ref('Drive'),
  enrollment: { ...ref('Enrollment'), unique: true }, score: Number, level: String, status: { type: String, default: 'valid' } }, T));

export const Payment = model('Payment', new Schema({ user: ref('User'), type: { type: String, enum: ['drive', 'booking'] }, refId: Schema.Types.ObjectId,
  amount: Number, orderId: String, razorpayPaymentId: String, dev: Boolean,
  status: { type: String, enum: ['created', 'captured', 'failed', 'refunded'], default: 'created' } }, T));

export const Notification = model('Notification', new Schema({ user: { ...ref('User'), index: true }, title: String, body: String, read: { type: Boolean, default: false } }, T));
export const Setting = model('Setting', new Schema({ key: { type: String, unique: true }, value: Schema.Types.Mixed }));
export const Audit = model('Audit', new Schema({ actor: ref('User'), action: String, target: String, meta: Schema.Types.Mixed }, T));

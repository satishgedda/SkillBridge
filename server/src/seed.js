// Creates the admin account and clearly-marked SAMPLE data for development. Run: npm run seed
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { User, Drive, Question, Slot, College } from './models.js';
if (process.env.NODE_ENV !== 'development') throw new Error('The seed script is for local development only. Set NODE_ENV=development in server/.env.');
const seedAccount = async ({ emailKey, passwordKey, name, role, profile, mentor }) => {
  const email = process.env[emailKey]?.trim().toLowerCase();
  const password = process.env[passwordKey];
  if (!email && !password) return null;
  if (!email || !password || password.length < 12) {
    throw new Error(`Set both ${emailKey} and ${passwordKey}; seeded passwords must be at least 12 characters.`);
  }
  return User.findOneAndUpdate(
    { email },
    { $setOnInsert: { name, email, password: await bcrypt.hash(password, 10), role, isSample: role !== 'admin', profile, mentor } },
    { upsert: true, new: true },
  );
};
await mongoose.connect(process.env.MONGO_URI);
const admin = await seedAccount({
  emailKey: 'SEED_ADMIN_EMAIL',
  passwordKey: 'SEED_ADMIN_PASSWORD',
  name: 'SkillBridge Admin',
  role: 'admin',
});
if (!admin) throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in server/.env before running the seed command.');
await seedAccount({
  emailKey: 'SEED_STUDENT_EMAIL',
  passwordKey: 'SEED_STUDENT_PASSWORD',
  name: 'Sample Student',
  role: 'student',
  profile: { branch: 'CSE', degree: 'B.Tech' },
});
const m = await seedAccount({
  emailKey: 'SEED_MENTOR_EMAIL',
  passwordKey: 'SEED_MENTOR_PASSWORD',
  name: 'Sample Mentor',
  role: 'mentor',
  mentor: { company: 'Sample Corp', title: 'Senior Engineer', years: 8, specialization: 'Full Stack', expertise: 'Technical + HR', status: 'approved', rate: 0 },
});
if (m && !(await Slot.exists({ mentor: m._id }))) for (let i = 1; i <= 5; i++) { const s = new Date(Date.now() + i * 864e5); s.setMinutes(0, 0, 0); await Slot.create({ mentor: m._id, start: s, end: new Date(+s + 45 * 60000) }); }

const demoUser = async ({ email, name, role, profile, mentor }) => {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({
    email,
    name,
    role,
    password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
    profile,
    mentor,
    isSample: true,
  });
};

const demoColleges = [
  { name: 'Northstar Institute of Technology', university: 'Northstar University', email: 'placements@northstar.demo.test', strength: 1240 },
  { name: 'Riverbend College of Engineering', university: 'Riverbend Technical University', email: 'careers@riverbend.demo.test', strength: 860 },
];
const demoCollegeRecords = [];
for (const college of demoColleges) {
  const owner = await demoUser({ email: college.email, name: college.name, role: 'college' });
  if (owner.role !== 'college' || !owner.isSample) continue;
  let record = await College.findOne({ email: college.email });
  if (!record) {
    record = await College.create({ ...college, owner: owner._id, status: 'approved', isSample: true });
  }
  if (!record.isSample) continue;
  if (!owner.college) { owner.college = record._id; await owner.save(); }
  demoCollegeRecords.push({ ...college, id: record._id });
}

const demoStudents = [
  { name: 'Ava Chen', email: 'ava.chen@northstar.demo.test', college: 0, branch: 'Computer Science', year: 2027, skills: ['JavaScript', 'React', 'SQL'], interests: ['Frontend engineering', 'Accessibility'], targetRole: 'Frontend Engineer' },
  { name: 'Kabir Iyer', email: 'kabir.iyer@northstar.demo.test', college: 0, branch: 'Information Technology', year: 2026, skills: ['Java', 'Data structures', 'Spring Boot'], interests: ['Backend systems', 'Cloud computing'], targetRole: 'Backend Engineer' },
  { name: 'Leila Haddad', email: 'leila.haddad@northstar.demo.test', college: 0, branch: 'Electronics and Communication', year: 2027, skills: ['Python', 'Pandas', 'Statistics'], interests: ['Machine learning', 'Data analysis'], targetRole: 'Data Analyst' },
  { name: 'Noah Williams', email: 'noah.williams@riverbend.demo.test', college: 1, branch: 'Computer Science', year: 2026, skills: ['TypeScript', 'Node.js', 'MongoDB'], interests: ['Full-stack development', 'Developer tools'], targetRole: 'Full-stack Engineer' },
  { name: 'Priya Nair', email: 'priya.nair@riverbend.demo.test', college: 1, branch: 'Information Technology', year: 2027, skills: ['C++', 'Algorithms', 'Git'], interests: ['Problem solving', 'Platform engineering'], targetRole: 'Software Engineer' },
  { name: 'Mateo Silva', email: 'mateo.silva@riverbend.demo.test', college: 1, branch: 'Electrical Engineering', year: 2026, skills: ['Python', 'Linux', 'Docker'], interests: ['Automation', 'Cloud infrastructure'], targetRole: 'DevOps Engineer' },
];
for (const student of demoStudents) {
  const college = demoCollegeRecords[student.college];
  if (!college) continue;
  const user = await demoUser({
    email: student.email,
    name: student.name,
    role: 'student',
    profile: {
      college: college.name,
      degree: 'B.Tech',
      branch: student.branch,
      gradYear: student.year,
      skills: student.skills,
      interests: student.interests,
      targetRole: student.targetRole,
    },
  });
  if (user.role === 'student' && user.isSample && !user.college) {
    user.college = college.id;
    await user.save();
  }
}

const demoMentors = [
  { name: 'Nisha Raman', email: 'nisha.raman@mentors.demo.test', company: 'Juniper Labs', title: 'Staff Software Engineer', years: 10, specialization: 'Distributed systems', expertise: 'System design, backend engineering, technical interviews', rate: 0 },
  { name: 'Arjun Mehta', email: 'arjun.mehta@mentors.demo.test', company: 'Cedar Works', title: 'Engineering Manager', years: 12, specialization: 'Full-stack product engineering', expertise: 'JavaScript, React, APIs, project discussions', rate: 0 },
  { name: 'Sofia Alvarez', email: 'sofia.alvarez@mentors.demo.test', company: 'Brightpath Analytics', title: 'Senior Data Scientist', years: 8, specialization: 'Applied data science', expertise: 'Python, SQL, statistics, behavioral interviews', rate: 0 },
];
for (const mentor of demoMentors) {
  const user = await demoUser({
    email: mentor.email,
    name: mentor.name,
    role: 'mentor',
    mentor: {
      company: mentor.company,
      title: mentor.title,
      years: mentor.years,
      specialization: mentor.specialization,
      expertise: mentor.expertise,
      rate: mentor.rate,
      status: 'approved',
    },
  });
  if (user.role !== 'mentor' || !user.isSample || user.mentor?.status !== 'approved') continue;
  if (!(await Slot.exists({ mentor: user._id, start: { $gt: new Date() } }))) {
    for (let i = 1; i <= 4; i++) {
      const start = new Date(Date.now() + i * 864e5);
      start.setHours(15, 0, 0, 0);
      await Slot.create({ mentor: user._id, start, end: new Date(+start + 45 * 60000) });
    }
  }
}

const Q = [ // [topic, text, options, correct]
  ['Aptitude', 'If 3 workers finish a job in 12 days, how many days do 6 workers need?', ['4', '6', '8', '24'], [1]],
  ['Aptitude', 'What is the next number: 2, 6, 12, 20, ?', ['28', '30', '32', '24'], [1]],
  ['DSA', 'Average time complexity of binary search?', ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], [1]],
  ['DSA', 'Which structure uses LIFO order?', ['Queue', 'Stack', 'Heap', 'Graph'], [1]],
  ['Programming', 'Which keyword prevents reassignment of a variable in JavaScript?', ['let', 'var', 'const', 'static'], [2]],
  ['OOP', 'Which are pillars of OOP?', ['Encapsulation', 'Inheritance', 'Compilation', 'Polymorphism'], [0, 1, 3]],
  ['DBMS', 'Which normal form removes partial dependency?', ['1NF', '2NF', '3NF', 'BCNF'], [1]],
  ['SQL', 'Which clause filters grouped rows?', ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], [1]],
  ['Operating Systems', 'Which scheduling algorithm can cause starvation?', ['Round Robin', 'FCFS', 'Priority scheduling', 'None'], [2]],
  ['Computer Networks', 'Which layer does TCP belong to?', ['Network', 'Transport', 'Application', 'Data Link'], [1]],
  ['Web Development', 'Which HTTP status means "Not Found"?', ['200', '301', '404', '500'], [2]],
  ['Web Development', 'Which hook stores state in a React function component?', ['useEffect', 'useState', 'useRef', 'useMemo'], [1]],
];
if (!(await Question.exists({ isSample: true }))) await Question.insertMany(Q.map(([topic, text, options, correct]) => ({ topic, text, options, correct, isSample: true })));
if (!(await Drive.exists({ title: 'Full Stack Developer Placement Simulation' }))) await Drive.create({ title: 'Full Stack Developer Placement Simulation', published: true, price: 0,
  description: 'A four-round simulation of a full stack developer placement drive.', eligibility: 'Final-year and pre-final-year engineering students',
  rounds: [
    { order: 1, name: 'Aptitude', kind: 'mcq', topics: ['Aptitude'], questionCount: 10, duration: 20, passingScore: 40, description: 'Quantitative and logical reasoning', instructions: 'Single attempt per sitting. Timer starts when you begin.', criteria: 'Accuracy' },
    { order: 2, name: 'Technical Assessment', kind: 'mcq', topics: ['DSA', 'Programming', 'OOP', 'DBMS', 'SQL', 'Operating Systems', 'Computer Networks', 'Web Development'], questionCount: 20, duration: 40, passingScore: 40, description: 'CS fundamentals and web development', instructions: 'Some questions have multiple correct answers.', criteria: 'Accuracy by topic' },
    { order: 3, name: 'Technical Interview', kind: 'interview', interviewType: 'technical', duration: 45, passingScore: 40, description: 'Live technical interview with a verified mentor', instructions: 'Keep your resume and projects ready.', criteria: 'DSA, programming, CS fundamentals, projects, problem solving' },
    { order: 4, name: 'HR Interview', kind: 'interview', interviewType: 'hr', duration: 30, passingScore: 40, description: 'Behavioural and communication round', instructions: 'Be ready to discuss strengths, teamwork and goals.', criteria: 'Communication, behaviour, confidence, teamwork, professionalism' }] });
console.log('Seeded development data and marked sample profiles. Generated sample profile passwords are not printed or reusable.');
await mongoose.disconnect();

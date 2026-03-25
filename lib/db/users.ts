interface User {
  id: string;
  password: string;
  role: 'doctor' | 'patient';
}

export const users: User[] = [
  {
    id: "doctor1",
    password: "doctor1@123",
    role: "doctor"
  },
  {
    id: "doctor2",
    password: "doctor2@123",
    role: "doctor"
  },
  {
    id: "patient1",
    password: "patient1@123",
    role: "patient"
  },
  {
    id: "patient2",
    password: "patient2@123",
    role: "patient"
  },
  {
    id: "patient3",
    password: "patient3@123",
    role: "patient"
  }
];

export function validateUser(id: string, password: string): User | null {
  const user = users.find(u => u.id === id && u.password === password);
  return user || null;
} 
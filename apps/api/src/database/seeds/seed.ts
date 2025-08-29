import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { users, tickets, ticketHistory } from '../schema';

async function createConnection() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'service_tickets',
  });

  return drizzle(pool);
}

async function seedUsers(db: NodePgDatabase<any>) {
  console.log('Seeding users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const sampleUsers = [
    {
      id: uuidv4(),
      username: 'john.doe',
      email: 'john.doe@company.com',
      password: hashedPassword,
      role: 'associate' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      username: 'jane.smith',
      email: 'jane.smith@company.com',
      password: hashedPassword,
      role: 'manager' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      username: 'bob.wilson',
      email: 'bob.wilson@company.com',
      password: hashedPassword,
      role: 'associate' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      username: 'alice.brown',
      email: 'alice.brown@company.com',
      password: hashedPassword,
      role: 'manager' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.insert(users).values(sampleUsers as any);
  console.log(`Inserted ${sampleUsers.length} users`);
  
  return sampleUsers;
}

async function seedTickets(db: NodePgDatabase<any>, sampleUsers: any[]) {
  console.log('Seeding tickets...');
  
  const associates = sampleUsers.filter(u => u.role === 'associate');
  const managers = sampleUsers.filter(u => u.role === 'manager');
  
  const sampleTickets = [
    {
      id: uuidv4(),
      ticketNumber: 'TKT-2024-0001',
      title: 'Login issues with mobile application',
      description: 'Users are reporting that they cannot log into the mobile application after the recent update. The error message shows "Invalid credentials" even with correct login details.',
      severity: 'high',
      status: 'open',
      createdBy: associates[0].id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: uuidv4(),
      ticketNumber: 'TKT-2024-0002',
      title: 'Database performance degradation',
      description: 'Database queries are running significantly slower than usual. Response times have increased from 100ms to 5+ seconds for basic operations.',
      severity: 'very_high' as const,
      status: 'open' as const,
      createdBy: managers[1].id,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day from now
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: uuidv4(),
      ticketNumber: 'TKT-2024-0003',
      title: 'Feature request: Dark mode support',
      description: 'Multiple users have requested dark mode support for the web application to improve usability during nighttime hours.',
      severity: 'high' as const,
      status: 'open' as const,
      createdBy: associates[0].id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: uuidv4(),
      ticketNumber: 'TKT-2024-0004',
      title: 'Email notifications not working',
      description: 'Users are not receiving email notifications for password resets and account updates. SMTP configuration may need review.',
      severity: 'medium' as const,
      status: 'closed' as const,
      createdBy: managers[0].id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: uuidv4(),
      ticketNumber: 'TKT-2024-0005',
      title: 'API rate limiting causing timeouts',
      description: 'Third-party API integration is hitting rate limits during peak hours, causing timeout errors for users.',
      severity: 'high',
      status: 'open',
      createdBy: associates[1].id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    },
  ];

  await db.insert(tickets).values(sampleTickets as any);
  console.log(`Inserted ${sampleTickets.length} tickets`);
  
  return sampleTickets;
}

async function seedTicketHistory(db: NodePgDatabase<any>, sampleTickets: any[], sampleUsers: any[]) {
  console.log('Seeding ticket history...');
  
  const historyEntries = [
    // History for ticket 1
    {
      id: uuidv4(),
      ticketId: sampleTickets[0].id,
      changedBy: sampleTickets[0].createdBy,
      actionType: 'created',
      oldValue: null,
      newValue: JSON.stringify({ status: 'open', severity: 'high' }),
      reason: 'Ticket created',
      createdAt: sampleTickets[0].createdAt,
    },
    // History for ticket 2
    {
      id: uuidv4(),
      ticketId: sampleTickets[1].id,
      changedBy: sampleTickets[1].createdBy,
      actionType: 'created',
      oldValue: null,
      newValue: JSON.stringify({ status: 'open', severity: 'very_high' }),
      reason: 'Ticket created',
      createdAt: sampleTickets[1].createdAt,
    },
    {
      id: uuidv4(),
      ticketId: sampleTickets[1].id,
      changedBy: sampleTickets[1].createdBy,
      actionType: 'status_changed',
      oldValue: JSON.stringify({ status: 'open' }),
      newValue: JSON.stringify({ status: 'open' }),
      reason: 'Started investigation',
      createdAt: new Date(sampleTickets[1].createdAt.getTime() + 2 * 60 * 60 * 1000), // 2 hours after creation
    },
    // History for ticket 4 (resolved)
    {
      id: uuidv4(),
      ticketId: sampleTickets[3].id,
      changedBy: sampleTickets[3].createdBy,
      actionType: 'created',
      oldValue: null,
      newValue: JSON.stringify({ status: 'open', severity: 'medium' }),
      reason: 'Ticket created',
      createdAt: sampleTickets[3].createdAt,
    },
    {
      id: uuidv4(),
      ticketId: sampleTickets[3].id,
      changedBy: sampleTickets[3].createdBy,
      actionType: 'status_changed',
      oldValue: JSON.stringify({ status: 'open' }),
      newValue: JSON.stringify({ status: 'open' }),
      reason: 'Started working on SMTP configuration',
      createdAt: new Date(sampleTickets[3].createdAt.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day after creation
    },
    {
      id: uuidv4(),
      ticketId: sampleTickets[3].id,
      changedBy: sampleTickets[3].createdBy,
      actionType: 'status_changed',
      oldValue: JSON.stringify({ status: 'open' }),
      newValue: JSON.stringify({ status: 'closed' }),
      reason: 'Fixed SMTP configuration and tested email delivery',
      createdAt: new Date(sampleTickets[3].updatedAt.getTime()),
    },
    // History for ticket 5 (reopened)
    {
      id: uuidv4(),
      ticketId: sampleTickets[4].id,
      changedBy: sampleTickets[4].createdBy,
      actionType: 'created',
      oldValue: null,
      newValue: JSON.stringify({ status: 'open', severity: 'high' }),
      reason: 'Ticket created',
      createdAt: sampleTickets[4].createdAt,
    },
    {
      id: uuidv4(),
      ticketId: sampleTickets[4].id,
      changedBy: sampleTickets[4].createdBy,
      actionType: 'status_changed',
      oldValue: JSON.stringify({ status: 'open' }),
      newValue: JSON.stringify({ status: 'closed' }),
      reason: 'Implemented rate limiting workaround',
      createdAt: new Date(sampleTickets[4].createdAt.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days after creation
    },
    {
      id: uuidv4(),
      ticketId: sampleTickets[4].id,
      changedBy: sampleTickets[4].createdBy,
      actionType: 'status_changed',
      oldValue: JSON.stringify({ status: 'closed' }),
      newValue: JSON.stringify({ status: 'open' }),
      reason: 'Issue reoccurred during peak hours',
      createdAt: sampleTickets[4].updatedAt,
    },
  ];

  await db.insert(ticketHistory).values(historyEntries as any);
  console.log(`Inserted ${historyEntries.length} history entries`);
}

async function main() {
  try {
    console.log('Starting database seeding...');
    
    const db = await createConnection();
    
    // Seed users first
    const sampleUsers = await seedUsers(db);
    
    // Seed tickets with user references
    const sampleTickets = await seedTickets(db, sampleUsers);
    
    // Seed ticket history
    await seedTicketHistory(db, sampleTickets, sampleUsers);
    
    console.log('Database seeding completed successfully!');
    
    console.log('\nSample login credentials:');
    console.log('Manager: jane.smith@company.com / password123');
    console.log('Associate: john.doe@company.com / password123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  main();
}

export { main as seedDatabase };

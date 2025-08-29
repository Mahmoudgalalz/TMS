import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from '@service-ticket/types';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  department: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Ticket, ticket => ticket.createdByUser)
  createdTickets: Ticket[];

  @OneToMany(() => Ticket, ticket => ticket.assignedToUser)
  assignedTickets: Ticket[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];
}

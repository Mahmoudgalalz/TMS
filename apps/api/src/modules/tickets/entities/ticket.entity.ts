import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TicketStatus, TicketPriority } from '@service-ticket/types';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Attachment } from '../../attachments/entities/attachment.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column()
  category: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  assignedTo: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;

  @ManyToOne(() => User, user => user.createdTickets)
  @JoinColumn({ name: 'createdBy' })
  createdByUser: User;

  @ManyToOne(() => User, user => user.assignedTickets)
  @JoinColumn({ name: 'assignedTo' })
  assignedToUser: User;

  @OneToMany(() => Comment, comment => comment.ticket)
  comments: Comment[];

  @OneToMany(() => Attachment, attachment => attachment.ticket)
  attachments: Attachment[];
}

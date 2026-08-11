import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Images {
  @PrimaryGeneratedColumn('uuid')
  image_id: string;

  @Column()
  url: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  uploaded_by: User;
}

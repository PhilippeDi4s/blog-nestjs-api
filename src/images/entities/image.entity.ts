import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Images {
  @PrimaryGeneratedColumn('uuid')
  image_id: string;

  @Column()
  publicId: string;

  @Column()
  url: string;

  @Column()
  folder: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  uploaded_by: User;

  @DeleteDateColumn()
  deletedAt: Date | null;
}

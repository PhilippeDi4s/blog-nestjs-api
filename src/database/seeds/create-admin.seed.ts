import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { UserRole } from 'src/user/enum/user-role.enum';
import { UserService } from 'src/user/user.service';

async function bootstrap() {
  const logger = new Logger(bootstrap.name);
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const userService = app.get(UserService);

    const name = process.env.ADMIN_NAME!;
    const email = process.env.ADMIN_EMAIL!;
    const password = process.env.ADMIN_PASSWORD!;

    const existing = await userService.findByEmail(email);
    if (existing) {
      logger.log('Admin já existe, pulando seed.');
      return;
    }

    await userService.createWithRole({
      name,
      email,
      password,
      role: UserRole.ADMIN,
    });
    logger.log('Admin criado com sucesso.');
  } catch (error) {
    logger.error('Falha ao criar admin', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();

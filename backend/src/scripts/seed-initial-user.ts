import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../auth/dto/create-user.dto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  try {
    // Check if user already exists
    const existingUser = await authService.findByEmail('admin@argi.local');
    
    if (existingUser) {
      console.log('Initial user already exists!');
      console.log('Email: admin@argi.local');
      return;
    }

    // Create initial admin user
    const initialUser: CreateUserDto = {
      email: 'admin@argi.local',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
    };

    const user = await authService.register(initialUser);
    console.log('✓ Initial user created successfully!');
    console.log('=====================================');
    console.log('Email:', initialUser.email);
    console.log('Password:', initialUser.password);
    console.log('Role:', user.role);
    console.log('=====================================');
    console.log('⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('Error creating initial user:', error.message);
  } finally {
    await app.close();
  }
}

bootstrap();

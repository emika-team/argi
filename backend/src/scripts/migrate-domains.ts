import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DomainService } from '../domain/domain.service';
import { AuthService } from '../auth/auth.service';

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const domainService = app.get(DomainService);
  const authService = app.get(AuthService);

  try {
    console.log('Starting domain migration...');

    // Find or create a default user for testing
    let defaultUser = await authService.findByEmail('admin@example.com');
    
    if (!defaultUser) {
      console.log('Creating default user...');
      const newUser = await authService.register({
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
      });
      defaultUser = await authService.findByEmail('admin@example.com');
    }

    if (!defaultUser) {
      throw new Error('Failed to create or find default user');
    }

    const defaultUserId = defaultUser._id.toString();

    // Add default domains
    const defaultDomains = [
      { domain: 'google.com', description: 'Google Search Engine' },
      { domain: 'github.com', description: 'GitHub Repository Hosting' },
      { domain: 'stackoverflow.com', description: 'Programming Q&A Platform' },
    ];

    for (const domainData of defaultDomains) {
      try {
        await domainService.addDomainToUser(defaultUserId, domainData);
        console.log(`Added domain: ${domainData.domain}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`Domain ${domainData.domain} already exists, skipping...`);
        } else {
          console.error(`Error adding domain ${domainData.domain}:`, error.message);
        }
      }
    }

    console.log('Domain migration completed successfully!');
    console.log(`Default user ID: ${defaultUserId}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await app.close();
  }
}

migrate(); 
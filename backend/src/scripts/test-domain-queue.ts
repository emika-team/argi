import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DomainQueueService } from '../domain/domain-queue.service';
import { DomainService } from '../domain/domain.service';

async function testDomainQueue() {
  console.log('🔍 Testing Domain Queue System...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const domainQueueService = app.get(DomainQueueService);
  const domainService = app.get(DomainService);

  try {
    // Test 1: Get queue stats
    console.log('📊 Getting queue statistics...');
    const stats = await domainQueueService.getQueueStats();
    console.log('Queue Stats:', JSON.stringify(stats, null, 2));
    console.log('');

    // Test 2: Add a test domain (if none exist)
    console.log('🆕 Checking if test domains exist...');
    const testUserId = '60f8c2d4e1b2c8a2a1234567'; // Mock user ID
    let testDomains;
    
    try {
      testDomains = await domainService.getUserDomainsDetailed(testUserId);
    } catch (error) {
      console.log('No test user found, creating test domains...');
      
      // Add test domains
      try {
        await domainService.addDomainToUser(testUserId, { domain: 'google.com' });
        await domainService.addDomainToUser(testUserId, { domain: 'github.com' });
        console.log('✅ Created test domains');
      } catch (addError) {
        console.log('ℹ️  Test domains may already exist');
      }
    }

    // Test 3: Trigger single domain check
    console.log('🔍 Testing single domain check...');
    await domainQueueService.addSingleDomainCheck('google.com');
    console.log('✅ Added single domain check job');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Trigger user domains check
    console.log('👤 Testing user domains check...');
    try {
      const userDomains = await domainService.getUserDomainsDetailed(testUserId);
      console.log(`Found ${userDomains.length} domains for user ${testUserId}`);
      
      // Add individual checks for each user domain
      for (const domainData of userDomains) {
        await domainQueueService.addSingleDomainCheck(domainData.domain, domainData._id.toString());
      }
      
      console.log(`✅ Added domain check jobs for ${userDomains.length} user domains`);
    } catch (error) {
      console.log('No domains found for test user, skipping user domains check test');
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Trigger all domains check
    console.log('🌐 Testing all domains check...');
    await domainQueueService.addAllDomainsCheck();
    console.log('✅ Added all domains check job');

    // Wait a moment for jobs to process
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 6: Get updated queue stats
    console.log('📊 Getting updated queue statistics...');
    const updatedStats = await domainQueueService.getQueueStats();
    console.log('Updated Queue Stats:', JSON.stringify(updatedStats, null, 2));

    // Test 7: Check if domains were updated
    console.log('🔍 Checking domain status updates...');
    try {
      const allDomains = await domainService.getAllActiveDomains();
      console.log(`Found ${allDomains.length} active domains`);
      
      for (const domain of allDomains.slice(0, 3)) { // Show first 3
        console.log(`Domain: ${domain.domain}`);
        console.log(`  Last checked: ${domain.lastCheckedAt}`);
        console.log(`  Days until expiry: ${domain.lastDaysUntilExpiry}`);
        console.log(`  Is expiring soon: ${domain.isExpiringSoon}`);
        console.log(`  Last error: ${domain.lastError || 'None'}`);
        console.log('');
      }
    } catch (error) {
      console.log('Error checking domain status:', error.message);
    }

    console.log('✅ Domain Queue System test completed successfully!');
    console.log('\n🔗 Bull Board Dashboard: http://localhost:3000/admin/queues');
    console.log('📋 Queue API Endpoints:');
    console.log('   GET /domain/queue/stats');
    console.log('   POST /domain/queue/check-all');
    console.log('   POST /domain/queue/check-user/:userId');
    console.log('   POST /domain/queue/check-domain');
    console.log('   POST /domain/queue/pause');
    console.log('   POST /domain/queue/resume');
    console.log('   POST /domain/queue/clear');

  } catch (error) {
    console.error('❌ Error testing domain queue:', error);
  } finally {
    await app.close();
  }
}

// Run the test
testDomainQueue().catch(console.error); 
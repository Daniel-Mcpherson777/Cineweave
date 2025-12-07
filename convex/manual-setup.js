// Temporary script to manually set up Convex until we fix the bundling issue

console.log(`
🎯 Manual Convex Setup Instructions

Since we're having bundling issues with Convex v1.28.2, let's set up the tables manually:

1. Go to: https://dashboard.convex.dev/d/affable-monitor-289

2. Click "Data" in the left sidebar

3. Create these 5 tables by clicking "Create Table" for each:

   Table 1: users
   Table 2: jobs
   Table 3: plans
   Table 4: payments
   Table 5: creditLedger

4. Then, click on the "plans" table and add these 3 documents manually:

   Document 1 (Starter):
   {
     "name": "starter",
     "monthlyCredits": 80,
     "price": 1000,
     "markup": 85,
     "features": ["80 credits/month", "~6-7 minutes of video", "720p @ 24fps", "24-hour video access", "Email support"],
     "isActive": true
   }

   Document 2 (Creator):
   {
     "name": "creator",
     "monthlyCredits": 250,
     "price": 3100,
     "markup": 75,
     "features": ["250 credits/month", "~20 minutes of video", "720p @ 24fps", "24-hour video access", "Priority queue", "Email support"],
     "isActive": true
   }

   Document 3 (Studio):
   {
     "name": "studio",
     "monthlyCredits": 500,
     "price": 6000,
     "markup": 70,
     "features": ["500 credits/month", "~40 minutes of video", "720p @ 24fps", "24-hour video access", "Priority queue", "Dedicated support"],
     "isActive": true
   }

5. Your Convex URLs are:
   - Dev: https://affable-monitor-289.convex.cloud
   - Prod: https://judicious-firefly-242.convex.cloud

6. Once done, we can test the app even without the Convex functions deployed!
   The frontend will work for viewing data, and we can fix the deployment later.

💡 This bundling issue is likely fixed in a newer Convex version or requires
   a specific Node version. For now, let's get you testing the app!
`);

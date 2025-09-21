# Database Setup Instructions

## Issue Resolved

The error you were encountering:
```
"Could not find the table 'public.customers' in the schema cache"
```

This error occurred because the required database tables (`customers` and `bookings`) were not created in your Supabase database.

## Solution

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Sign in with your account
3. Select your project: `kvbyieehwdlbmwqvdivr`

### Step 2: Run Database Setup Script
1. In your Supabase dashboard, go to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire content of `database-setup.sql` file
4. Paste it into the SQL editor
5. Click **Run** button

### Step 3: Verify Tables Were Created
After running the script, you should see:
- `customers` table with columns: `id`, `full_name`, `id_number`, `phone_number`, `email`, `created_at`, `updated_at`
- `bookings` table with columns: `id`, `customer_id`, `check_in_date`, `check_out_date`, `adults`, `children`, `notes`, `total_amount`, `deposit_paid`, `status`, `signature`, `created_at`, `updated_at`

### Step 4: Test the Connection
Run the database test script to verify everything is working:
```bash
node test-db.js
```

If successful, you should see all tests pass with ✅ checkmarks.

## What the Script Creates

### Tables
- **customers**: Stores customer information with unique ID numbers
- **bookings**: Stores booking information linked to customers

### Features
- **Primary Keys**: UUID-based primary keys for both tables
- **Foreign Key**: `bookings.customer_id` references `customers.id`
- **Indexes**: Optimized for common queries (ID number, phone, status, etc.)
- **Row Level Security**: Enabled with permissive policies
- **Timestamps**: Automatic `created_at` and `updated_at` timestamps
- **Triggers**: Auto-update `updated_at` on record modifications

### Default Status Values
The system uses these Hebrew status values for bookings:
- `ממתין לאישור לקוח` (Waiting for customer confirmation)
- `הזמנה מאושרת` (Booking confirmed)
- `הושלמה` (Completed)
- `בוטלה` (Cancelled)

## Security Note

The current setup allows all operations on both tables. For production use, you may want to restrict the Row Level Security policies to be more specific based on your authentication requirements.

## After Setup

Once the database is set up:
1. Your booking creation should work without errors
2. Customer data will be properly stored and retrieved
3. Returning customers will be automatically detected by ID number or phone number
4. The application will function as designed according to the WARP.md specifications
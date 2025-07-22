# Restaurant Features Documentation

## Overview

The InstantFork platform now includes a complete restaurant management system that allows restaurants to register, create deals, and track their performance.

## Features

### 1. Restaurant Registration (`/restaurant-register`)

A multi-step registration process for restaurants:

**Step 1: Account Creation**
- Email address
- Password with confirmation
- Secure authentication via Supabase

**Step 2: Restaurant Details**
- Restaurant name
- Owner name
- Phone number
- Category selection (Pizza, Coffee, Dining, Fast Food, Desserts, Drinks)
- Description

**Step 3: Location Information**
- Street address
- City, State, ZIP code
- Website (optional)
- Automatic geocoding for map display

**Step 4: Review & Submit**
- Summary of all information
- Terms and conditions acceptance
- Account creation

### 2. Restaurant Dashboard (`/restaurant-dashboard`)

A comprehensive dashboard with three main sections:

#### Deals Management
- **Create New Deals**: Add time-limited offers with pricing, descriptions, and tags
- **Edit Existing Deals**: Modify deal details anytime
- **Toggle Active Status**: Activate/deactivate deals without deletion
- **Delete Deals**: Permanently remove deals
- **Real-time Metrics**: View count and claim statistics for each deal

#### Restaurant Profile
- Edit restaurant information
- Update contact details
- Modify business description
- Change category

#### Analytics
- **Total Views**: Aggregate views across all deals
- **Total Claims**: Number of deals claimed by users
- **Active Deals**: Current number of live deals
- **Average Discount**: Calculated discount percentage
- **Deal Performance**: Individual deal conversion rates

### 3. Database Schema

#### Tables Created:

**restaurants**
- Stores restaurant profile information
- Linked to auth.users via owner_id
- Includes location data as JSONB

**deals**
- Time-based offers from restaurants
- Tracks views and claims
- Supports tags and categories
- Active/inactive status

**deal_claims**
- Tracks which users claimed which deals
- Supports redemption tracking
- Prevents duplicate claims

### 4. Security Features

- **Row Level Security (RLS)**: Ensures data isolation
- **Authentication Required**: All restaurant features require login
- **Owner-only Access**: Restaurants can only manage their own data
- **Public Deal Visibility**: Active deals are visible to all users

### 5. User Experience Features

- **Responsive Design**: Works on all devices
- **Real-time Updates**: Changes reflect immediately
- **Form Validation**: Prevents errors during data entry
- **Progress Indicators**: Clear multi-step process
- **Error Handling**: User-friendly error messages

## Setup Instructions

### 1. Database Setup

1. Create a Supabase project
2. Run the SQL script from `supabase/complete_setup.sql`
3. This creates all necessary tables and security policies

### 2. Environment Configuration

Add to your `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Testing the Features

1. Navigate to `/restaurant-register` to create a restaurant account
2. Complete the registration process
3. Access the dashboard at `/restaurant-dashboard`
4. Create test deals to verify functionality

## API Integration

The restaurant features integrate with the existing InstantFork API:

- Deals created by restaurants appear in the main app
- Users can view, claim, and redeem restaurant deals
- Analytics track user engagement
- Real-time updates via Supabase subscriptions

## Future Enhancements

Potential improvements for the restaurant system:

1. **Image Uploads**: Direct image upload instead of URLs
2. **Bulk Deal Management**: Create multiple deals at once
3. **Advanced Analytics**: Charts and graphs for performance
4. **Email Notifications**: Alert restaurants of claims
5. **QR Code Generation**: For deal redemption
6. **Revenue Tracking**: Monitor actual sales from deals
7. **Customer Reviews**: Allow feedback on deals
8. **Scheduling**: Auto-activate deals at specific times

## Troubleshooting

### Common Issues:

**"Restaurant not found" error**
- Ensure the user has completed registration
- Check that the restaurants table has the user's entry

**Deals not appearing**
- Verify deal is marked as active
- Check that end_time is in the future
- Ensure proper database permissions

**Can't update restaurant profile**
- Confirm user is logged in
- Check RLS policies are properly set
- Verify owner_id matches auth.uid()

## Support

For additional help:
1. Check the browser console for errors
2. Review Supabase logs for database issues
3. Ensure all environment variables are set
4. Verify database migrations completed successfully

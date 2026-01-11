# Role-Based Permissions System

This application uses a comprehensive role-based permissions system configured entirely through Discord roles in `src/lib/config.ts`.

## Configuration

### Discord Roles

Configure your Discord role names in `src/lib/config.ts`:

```typescript
roles: {
  // Roles that grant full admin access
  adminRoles: ['Admin', 'Owner', 'Head Admin'],
  
  // Roles that grant high priority on applications
  priorityRoles: ['VIP', 'Donor', 'Premium', 'Supporter'],
  
  // Roles that grant moderator access
  moderatorRoles: ['Moderator', 'Mod', 'Support Team'],
  
  // Roles that can review applications
  reviewerRoles: ['Reviewer', 'Application Team', 'Staff'],
}
```

### Permissions

Configure what each role level can do:

```typescript
permissions: {
  canReviewApplications: 'reviewer', // admin, reviewer, or moderator
  canManageBans: 'moderator',        // admin or moderator
  canViewAnalytics: 'moderator',     // admin or moderator
  canManageAnnouncements: 'moderator', // admin or moderator
  canManageRules: 'admin',           // admin only
  canViewActivityLog: 'moderator',   // admin or moderator
}
```

Permission levels (in order of access):
- `'admin'` - Only users with admin roles
- `'moderator'` - Users with admin OR moderator roles
- `'reviewer'` - Users with admin OR moderator OR reviewer roles

## Helper Functions

### Role Checks

```typescript
import { 
  hasAdminRole, 
  hasModeratorRole, 
  hasReviewerRole,
  hasPriorityRole,
  hasAnyStaffRole 
} from '@/lib/config'

// Check if user has admin role
const isAdminUser = hasAdminRole(userRoles)

// Check if user has moderator role
const isModUser = hasModeratorRole(userRoles)

// Check if user has reviewer role
const isReviewer = hasReviewerRole(userRoles)

// Check if user has priority role (VIP, Donor, etc.)
const isPriority = hasPriorityRole(userRoles)

// Check if user has any staff role
const isStaff = hasAnyStaffRole(userRoles)
```

### Permission Checks

```typescript
import { hasPermission } from '@/lib/config'
import { getUserRoles } from '@/lib/discord-bot'

// Get user's Discord roles
const userRoles = await getUserRoles(discordId)

// Check if user can perform specific action
const canReview = hasPermission(userRoles, 'canReviewApplications')
const canManageBans = hasPermission(userRoles, 'canManageBans')
const canManageRules = hasPermission(userRoles, 'canManageRules')
```

### Client-Side Permission Hook

```typescript
import { usePermissions } from '@/hooks/use-permissions'

function MyComponent() {
  const { permissions, loading } = usePermissions()
  
  if (loading) return <div>Loading...</div>
  
  if (!permissions.hasAnyStaffRole) {
    return <div>Access Denied</div>
  }
  
  return (
    <div>
      {permissions.canManageRules && <RulesManager />}
      {permissions.canReviewApplications && <ApplicationReviewer />}
    </div>
  )
}
```

## API Route Example

Here's how to protect an API route with role-based permissions:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, hasPermission } from '@/lib/auth'
import { getUserRoles } from '@/lib/discord-bot'

export async function POST(req: Request) {
  // Get session
  const session = await getServerSession(authOptions)
  const discordId = session?.discord?.id
  
  if (!discordId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's Discord roles
  let userRoles: string[] = []
  try {
    userRoles = await getUserRoles(discordId)
  } catch (error) {
    console.error('Error fetching user roles:', error)
  }

  // Check permission
  if (!hasPermission(userRoles, 'canManageRules')) {
    return NextResponse.json({ 
      error: 'Forbidden - Insufficient permissions' 
    }, { status: 403 })
  }

  // Your protected code here...
  return NextResponse.json({ success: true })
}
```

## Client-Side Permission Check

Fetch user permissions on the client:

```typescript
const response = await fetch('/api/auth/permissions')
const permissions = await response.json()

if (permissions.canManageRules) {
  // Show manage rules button
}

if (permissions.canReviewApplications) {
  // Show approve/deny buttons
}
```

## Permission Hierarchy

1. **Admin Roles** - Full access to everything
2. **Moderator Roles** - Access to most features except rule management (configurable)
3. **Reviewer Roles** - Access to review applications only (configurable)
4. **Priority Roles** - No admin access, but applications get high priority

## Features

### Automatic Priority Updates

When a user's Discord roles change:
- If they gain a priority role → Application priority changes to `high`
- If they lose all priority roles → Application priority changes to `normal`
- Notification sent to Discord channel
- Logged in activity log as "System (Auto)"

### Priority Roles on Application Submission

When submitting an application:
- System checks user's Discord roles
- If user has any priority role → Application gets `high` priority
- Otherwise → Application gets `normal` priority

## Environment Requirements

Make sure these are set in your `.env`:

```env
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_server_id
DISCORD_NOTIFICATION_CHANNEL_ID=your_channel_id
NEXTAUTH_SECRET=your_secret_key
```

## Bot Requirements

Your Discord bot needs these intents enabled in the Discord Developer Portal:
- `Guilds`
- `GuildMembers` (privileged intent)
- `DirectMessages`

## Testing Permissions

Use the `/api/auth/permissions` endpoint to test your configuration:

```bash
curl http://localhost:3000/api/auth/permissions
```

Response:
```json
{
  "hasAdminRole": true,
  "hasModeratorRole": false,
  "hasReviewerRole": false,
  "hasAnyStaffRole": true,
  "canReviewApplications": true,
  "canManageBans": true,
  "canViewAnalytics": true,
  "canManageAnnouncements": true,
  "canManageRules": true,
  "canViewActivityLog": true,
  "roles": ["Admin", "VIP"],
  "configuredRoles": {
    "admin": ["Admin", "Owner", "Head Admin"],
    "moderator": ["Moderator", "Mod", "Support Team"],
    "reviewer": ["Reviewer", "Application Team", "Staff"],
    "priority": ["VIP", "Donor", "Premium", "Supporter"]
  }
}
```

## Customization

To add new permissions:

1. Add to `permissions` object in `config.ts`
2. Use in API routes with `hasPermission()`
3. Check on client with `/api/auth/permissions`

Example:
```typescript
permissions: {
  // ... existing permissions
  canDeleteApplications: 'admin',
  canExportData: 'moderator',
}
```

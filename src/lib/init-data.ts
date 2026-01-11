import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')

// Define all required data files with their initial structures
const dataFiles = {
  'applications.json': [],
  'application_drafts.json': [],
  'archived_applications.json': [],
  'application-types.json': [
    {
      id: '1',
      name: 'Staff Application',
      description: 'Apply to become a staff member',
      cooldownDays: 14,
      allowMultiplePending: false,
      requireUniqueApproval: true,
      fields: [
        { id: '1', label: 'Character Name', type: 'text', required: true, placeholder: 'Enter your character name' },
        { id: '2', label: 'Age', type: 'number', required: true, placeholder: 'Your age' },
        { id: '3', label: 'Steam ID', type: 'text', required: true, placeholder: 'steam:xxxxx' },
        { id: '4', label: 'CFX Forum Account', type: 'text', required: true, placeholder: 'https://forum.cfx.re/u/username' },
        { id: '5', label: 'Why do you want to join?', type: 'textarea', required: true, placeholder: 'Explain your motivation...' },
        { id: '6', label: 'Previous experience', type: 'textarea', required: true, placeholder: 'Describe your previous roleplay experience...' },
        { id: '7', label: 'Character backstory', type: 'textarea', required: true, placeholder: 'Tell us about your character...' }
      ],
      enabled: true,
      createdAt: new Date().toISOString()
    }
  ],
  'tickets.json': [],
  'bans.json': [],
  'blacklist.json': [],
  'notifications.json': [],
  'announcements.json': [
    {
      id: '1',
      title: 'Welcome to the Server!',
      content: 'Welcome to our FiveM roleplay server. Please read the rules and submit an application to get started.',
      type: 'community',
      priority: 'medium',
      author: 'System',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  'rules.json': [
    {
      category: 'General Rules',
      rules: [
        'Be respectful to all players and staff members',
        'No metagaming or powergaming',
        'Stay in character at all times in the server',
        'Follow all staff instructions immediately',
        'No advertising other servers or communities'
      ]
    },
    {
      category: 'Roleplay Rules',
      rules: [
        'Value your life at all times (FearRP)',
        'No Random Death Match (RDM)',
        'No Vehicle Death Match (VDM)',
        'Proper initiation required before hostile actions',
        'No cop baiting or unrealistic behavior'
      ]
    },
    {
      category: 'Server Rules',
      rules: [
        'No hacking, exploiting, or bug abuse',
        'Report bugs and glitches to staff',
        'No stream sniping or ghosting',
        'Respect the economy and don\'t abuse game mechanics',
        'English only in global communications'
      ]
    }
  ],
  'shop-products.json': [],
  'activity_log.json': []
}

export function initializeDataFiles() {
  try {
    // Create data directory if it doesn't exist
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true })
      console.log('✅ Created data directory')
    }

    // Create each file if it doesn't exist
    let filesCreated = 0
    Object.entries(dataFiles).forEach(([filename, initialData]) => {
      const filePath = join(DATA_DIR, filename)
      
      if (!existsSync(filePath)) {
        writeFileSync(filePath, JSON.stringify(initialData, null, 2))
        console.log(`✅ Created ${filename}`)
        filesCreated++
      }
    })

    if (filesCreated > 0) {
      console.log(`\n🎉 Data initialization complete! Created ${filesCreated} files.`)
    } else {
      console.log('✅ All data files already exist')
    }

    return { success: true, filesCreated }
  } catch (error) {
    console.error('❌ Error initializing data files:', error)
    return { success: false, error }
  }
}

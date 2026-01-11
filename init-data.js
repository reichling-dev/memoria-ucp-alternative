const fs = require('fs');
const path = require('path');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory');
}

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
        { id: '4', label: 'Why do you want to be staff?', type: 'textarea', required: true, placeholder: 'Explain your motivation...' },
        { id: '5', label: 'Previous experience', type: 'textarea', required: true, placeholder: 'Describe your previous moderation/admin experience...' }
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
      content: 'Welcome to our FiveM roleplay server. Please read the rules before applying.',
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
        'Be respectful to all players and staff',
        'No metagaming or powergaming',
        'Stay in character at all times',
        'Follow staff instructions'
      ]
    },
    {
      category: 'Roleplay Rules',
      rules: [
        'Value your life at all times',
        'No Random Death Match (RDM)',
        'No Vehicle Death Match (VDM)',
        'Proper initiation before hostile actions'
      ]
    }
  ],
  'shop-products.json': [],
  'activity_log.json': []
};

// Create each file if it doesn't exist
Object.entries(dataFiles).forEach(([filename, initialData]) => {
  const filePath = path.join(dataDir, filename);
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    console.log(`✅ Created ${filename}`);
  } else {
    console.log(`⏭️  ${filename} already exists, skipping`);
  }
});

console.log('\n🎉 Data initialization complete!');
console.log('📁 All required JSON files are ready in the /data directory');

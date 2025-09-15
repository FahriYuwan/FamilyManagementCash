import { createClient } from '@/lib/supabase'

async function debugFamilyMembers() {
  const supabase = createClient()
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized')
    return
  }
  
  // Test family ID from the user's report
  const familyId = 'eb4faa44-2fe0-437d-9a32-b8d7c87a3d53'
  
  console.log('🔍 Debugging family members for family ID:', familyId)
  
  // 1. Check if the family exists
  const { data: family, error: familyError } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single()
  
  if (familyError) {
    console.error('❌ Error fetching family:', familyError)
    return
  }
  
  console.log('✅ Family found:', family)
  
  // 2. Check all users in this family
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('family_id', familyId)
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError)
    return
  }
  
  console.log('👥 Users in family:', users)
  console.log('📊 Total users in family:', users?.length || 0)
  
  // 3. Check each user individually
  if (users && users.length > 0) {
    for (const user of users) {
      console.log(`\n👤 User: ${(user as any).name} (${(user as any).role})`)
      console.log(`   ID: ${(user as any).id}`)
      console.log(`   Family ID: ${(user as any).family_id}`)
    }
  }
  
  // 4. Test the family query with members
  const { data: familyWithMembers, error: familyWithMembersError } = await supabase
    .from('families')
    .select(`
      *,
      members:users(*)
    `)
    .eq('id', familyId)
    .single()
  
  if (familyWithMembersError) {
    console.error('❌ Error fetching family with members:', familyWithMembersError)
    return
  }
  
  console.log('\n🏠 Family with members:', familyWithMembers)
  console.log('📊 Members count:', (familyWithMembers as any)?.members?.length || 0)
}

// Run the debug function
debugFamilyMembers()
  .then(() => console.log('\n✅ Debug completed'))
  .catch((error) => console.error('\n❌ Debug failed:', error))
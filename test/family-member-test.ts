// Family Member Display Test
// This test verifies that family members can see each other in the family data

import { createClient } from '@/lib/supabase'

// Define types for our data
interface User {
  id: string
  email: string
  name: string
  role: string
  family_id: string | null
  family?: Family
}

interface Family {
  id: string
  name: string
  members: User[]
}

async function testFamilyMemberDisplay() {
  const supabase = createClient()
  
  // Test user IDs (replace with actual test user IDs)
  const ayahUserId = 'b64f492c-b038-4e4b-a117-6bf84ba8b598'
  const ibuUserId = 'e1bb548f-b276-4da2-9308-ea5ff28acd3d'
  const familyId = 'c5d27540-f01e-4ddc-a487-e5c992bb00bb'
  
  console.log('Testing family member display...')
  
  if (!supabase) {
    console.error('Supabase client not initialized')
    return
  }
  
  // Test 1: Fetch ayah's profile and check family members
  console.log('\n--- Testing Ayah Profile ---')
  const { data: ayahData, error: ayahError } = await supabase
    .from('users')
    .select(`
      *,
      family:families(
        *,
        members:users(*)
      )
    `)
    .eq('id', ayahUserId)
    .single()
  
  if (ayahError) {
    console.error('Error fetching ayah profile:', ayahError)
  } else {
    const user = ayahData as unknown as User
    console.log('Ayah profile:', user)
    console.log('Ayah family members count:', user.family?.members?.length)
    console.log('Ayah family members:', user.family?.members?.map((m: any) => m.name))
  }
  
  // Test 2: Fetch ibu's profile and check family members
  console.log('\n--- Testing Ibu Profile ---')
  const { data: ibuData, error: ibuError } = await supabase
    .from('users')
    .select(`
      *,
      family:families(
        *,
        members:users(*)
      )
    `)
    .eq('id', ibuUserId)
    .single()
  
  if (ibuError) {
    console.error('Error fetching ibu profile:', ibuError)
  } else {
    const user = ibuData as unknown as User
    console.log('Ibu profile:', user)
    console.log('Ibu family members count:', user.family?.members?.length)
    console.log('Ibu family members:', user.family?.members?.map((m: any) => m.name))
  }
  
  // Test 3: Direct family fetch
  console.log('\n--- Testing Direct Family Fetch ---')
  const { data: familyData, error: familyError } = await supabase
    .from('families')
    .select(`
      *,
      members:users(*)
    `)
    .eq('id', familyId)
    .single()
  
  if (familyError) {
    console.error('Error fetching family directly:', familyError)
  } else {
    const family = familyData as unknown as Family
    console.log('Direct family fetch:', family)
    console.log('Family members count:', family.members?.length)
    console.log('Family members:', family.members?.map((m: any) => `${m.name} (${m.role})`))
  }
  
  console.log('\n--- Test Complete ---')
}

// Run the test
testFamilyMemberDisplay().catch(console.error)
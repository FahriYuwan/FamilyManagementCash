// Family Synchronization Test
// This test verifies that family members can see each other and edit each other's data

import { createClient } from '@/lib/supabase'

async function testFamilySynchronization() {
  const supabase = createClient()
  
  if (!supabase) {
    console.error('Supabase client not initialized')
    return
  }
  
  console.log('Testing family synchronization...')
  
  // Test 1: Verify family members can see each other
  console.log('\n--- Test 1: Family Members Visibility ---')
  
  // Test user IDs (replace with actual test user IDs from your database)
  const testFamilyId = 'c5d27540-f01e-4ddc-a487-e5c992bb00bb'
  
  try {
    // Fetch family with all members
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .select(`
        *,
        members:users(*)
      `)
      .eq('id', testFamilyId)
      .single()
    
    if (familyError) {
      console.error('Error fetching family:', familyError)
    } else {
      console.log('Family name:', (familyData as any).name)
      console.log('Total members:', (familyData as any).members?.length)
      
      if ((familyData as any).members) {
        (familyData as any).members.forEach((member: any, index: number) => {
          console.log(`Member ${index + 1}: ${member.name} (${member.role})`)
        })
      }
      
      // Verify we have both ayah and ibu
      const hasAyah = (familyData as any).members?.some((m: any) => m.role === 'ayah')
      const hasIbu = (familyData as any).members?.some((m: any) => m.role === 'ibu')
      
      console.log('Has ayah:', hasAyah)
      console.log('Has ibu:', hasIbu)
      
      if (hasAyah && hasIbu) {
        console.log('✅ Test 1 PASSED: Both family members are visible')
      } else {
        console.log('❌ Test 1 FAILED: Missing family members')
      }
    }
  } catch (error) {
    console.error('Error in Test 1:', error)
  }
  
  console.log('\n--- Test Complete ---')
  console.log('Note: For Test 2 (edit access), you can manually test by:')
  console.log('1. Logging in as one family member and creating a transaction')
  console.log('2. Logging in as the other family member and trying to edit/delete it')
  console.log('3. Both operations should succeed with the updated RLS policies')
}

// Run the test
testFamilySynchronization().catch(console.error)
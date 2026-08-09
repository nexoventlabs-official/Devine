// Indian states -> districts used by the dealer signup Flow's dynamic dropdowns.
// Tamil Nadu is complete (brand home state); other states carry major districts.
export const STATES_DISTRICTS = {
  'Tamil Nadu': ['Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'],
  'Kerala': ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'],
  'Karnataka': ['Bengaluru Urban', 'Belagavi', 'Ballari', 'Dakshina Kannada', 'Dharwad', 'Hubli', 'Kalaburagi', 'Mandya', 'Mysuru', 'Shivamogga', 'Tumakuru', 'Udupi'],
  'Andhra Pradesh': ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa'],
  'Telangana': ['Adilabad', 'Hyderabad', 'Karimnagar', 'Khammam', 'Mahbubnagar', 'Medak', 'Nalgonda', 'Nizamabad', 'Rangareddy', 'Warangal'],
  'Maharashtra': ['Ahmednagar', 'Aurangabad', 'Kolhapur', 'Mumbai', 'Mumbai Suburban', 'Nagpur', 'Nashik', 'Pune', 'Solapur', 'Thane'],
  'Delhi': ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'South Delhi', 'West Delhi'],
  'Gujarat': ['Ahmedabad', 'Bhavnagar', 'Gandhinagar', 'Jamnagar', 'Rajkot', 'Surat', 'Vadodara'],
  'Uttar Pradesh': ['Agra', 'Aligarh', 'Allahabad', 'Bareilly', 'Ghaziabad', 'Gorakhpur', 'Kanpur', 'Lucknow', 'Meerut', 'Noida', 'Varanasi'],
  'West Bengal': ['Darjeeling', 'Howrah', 'Hooghly', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'South 24 Parganas'],
  'Rajasthan': ['Ajmer', 'Alwar', 'Bikaner', 'Jaipur', 'Jodhpur', 'Kota', 'Udaipur'],
  'Punjab': ['Amritsar', 'Bathinda', 'Jalandhar', 'Ludhiana', 'Mohali', 'Patiala'],
  'Madhya Pradesh': ['Bhopal', 'Gwalior', 'Indore', 'Jabalpur', 'Ujjain'],
  'Haryana': ['Ambala', 'Faridabad', 'Gurugram', 'Hisar', 'Karnal', 'Panipat', 'Rohtak'],
  'Bihar': ['Bhagalpur', 'Gaya', 'Muzaffarpur', 'Patna'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur'],
  'Assam': ['Dibrugarh', 'Guwahati', 'Jorhat', 'Silchar']
};

export const STATES = Object.keys(STATES_DISTRICTS);

export function districtsFor(state) {
  return STATES_DISTRICTS[state] || [];
}

// Flow dropdown option shape: { id, title }
export function stateOptions() {
  return STATES.map((s) => ({ id: s, title: s }));
}

export function districtOptions(state) {
  return districtsFor(state).map((d) => ({ id: d, title: d }));
}

export default { STATES, STATES_DISTRICTS, districtsFor, stateOptions, districtOptions };

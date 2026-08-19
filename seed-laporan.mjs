import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'fireguard',
});

const REPORTERS = [
  { name: 'Asep Kurniawan', phone: '082372661826' },
  { name: 'Sutanto', phone: '081369444299' },
  { name: 'Ponitik', phone: '0895627006067' },
  { name: 'Ismail', phone: '081273267519' },
  { name: 'Herman', phone: '082160800513' },
  { name: 'Saliman', phone: '085368292622' },
  { name: 'Johan Arief', phone: '081373296268' },
  { name: 'Kurnia', phone: '081367239222' },
  { name: 'Sany', phone: '082180919102' },
  { name: 'Misyadi', phone: '081271112299' },
  { name: 'Barkoni', phone: '082184465236' },
  { name: 'Bambang Mujiono', phone: '085709567747' },
  { name: 'Rudi Hartono', phone: '081368052881' } // Pimpinan
];

const PETUGAS_LIST = [
  { name: 'Petugas Joko', phone: '081211111111', email: 'joko@siagabencana.cloud' },
  { name: 'Petugas Wahyu', phone: '081222222222', email: 'wahyu@siagabencana.cloud' },
  { name: 'Petugas Riyan', phone: '081233333333', email: 'riyan@siagabencana.cloud' },
  { name: 'Petugas Dedi', phone: '081244444444', email: 'dedi@siagabencana.cloud' },
  { name: 'Petugas Andi', phone: '081255555555', email: 'andi@siagabencana.cloud' }
];

// Hash password default untuk testing (contoh: 123456 atau password)
const DEFAULT_PASSWORD_HASH = '$2b$10$rw21cMSf5S0QNlKJrhxZYuoKdMzeoj/a5JgLCftYEx8flSI1RcMwe';

// Helper to make email from name
function makeEmail(name) {
  return name.toLowerCase().replace(/\s+/g, '.') + '@example.com';
}

const FAKE_REPORTERS = [
  { name: 'Anonim', phone: '080000000000' },
  { name: 'Hamba Allah', phone: '081111111111' },
  { name: 'Warga Iseng', phone: '082222222222' },
  { name: 'Budi (Palsu)', phone: '089999999999' },
  { name: 'Tidak Diketahui', phone: '088888888888' },
  { name: 'Tester', phone: '087777777777' },
  { name: 'Ucok', phone: '086666666666' }
];

const REAL_DESCRIPTIONS = [
  'Ada api membesar di lahan kosong dekat tiang listrik, tolong segera ditangani sebelum merambat.',
  'Terlihat asap tebal dari arah rawa-rawa belakang pemukiman warga.',
  'Kebakaran semak belukar di pinggir jalan, apinya lumayan besar tertiup angin.',
  'Tolong ada api merambat ke arah kebun warga, butuh pemadam segera!',
  'Laporan kejadian kebakaran lahan kering, belum terlalu besar tapi khawatir menyebar.',
  'Ada yang bakar sampah sembarangan lalu merembet ke ilalang sekitarnya.',
  'Lahan kosong terbakar, asapnya sangat mengganggu jarak pandang di jalan.'
];

const FAKE_DESCRIPTIONS = [
  'Ada naga terbang menyemburkan api bang',
  'Tolong rumah saya kebakaran (padahal bohong)',
  'Tes laporan aja masuk apa ngga',
  'Ada kebakaran jenggot nih tolong dipadamkan',
  'Cuma api unggun kecil doang kok',
  'Iseng tes aplikasi, maaf ya',
  'Ada kebakaran besar! (hoax)'
];

// Coordinate bounds for Plaju Darat (Lebih akurat di sekitar Tegal Binangun, menjauh dari Jakabaring)
const MIN_LAT = -3.0350;
const MAX_LAT = -3.0180;
const MIN_LNG = 104.8000;
const MAX_LNG = 104.8150;

function getRandomReporter() {
  return REPORTERS[Math.floor(Math.random() * REPORTERS.length)];
}

function getRandomCoordinate() {
  const lat = MIN_LAT + Math.random() * (MAX_LAT - MIN_LAT);
  const lng = MIN_LNG + Math.random() * (MAX_LNG - MIN_LNG);
  return { lat, lng };
}

// Some dummy image URLs that look like real street views / fields
// Kumpulan Panoid dari Google Street View di area Plaju Darat
const PANO_IDS = [
  'fFCD963J-Jy17rDCHTsZGQ',
  '7oonYCAB3sT_SFET1mz9Vw',
  'qsATc9veIBh726fqbUE9ag',
  'v3xvdAb5RS6JhiE4LBKjNw',
  'x-492eILjwlkSV7B1CCvaA'
];

function getRandomImage() {
  const panoId = PANO_IDS[Math.floor(Math.random() * PANO_IDS.length)];
  // Mengambil sudut pandang acak dari 0 hingga 360 derajat agar gambarnya bervariasi
  const yaw = Math.floor(Math.random() * 360);
  return `https://streetviewpixels-pa.googleapis.com/v1/thumbnail?cb_client=maps_sv.tactile&w=900&h=600&pitch=0&panoid=${panoId}&yaw=${yaw}`;
}

function getRandomTime(date, startHour, endHour) {
  const d = new Date(date);
  const h = startHour + Math.floor(Math.random() * (endHour - startHour));
  const m = Math.floor(Math.random() * 60);
  const s = Math.floor(Math.random() * 60);
  d.setHours(h, m, s, 0);
  return d;
}

function formatDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function main() {
  // Pastikan reporter ada di database users agar statusnya Terdaftar, bukan GUEST
  for (const reporter of REPORTERS) {
    const [existing] = await pool.query('SELECT id FROM users WHERE phone_number = ?', [reporter.phone]);
    if (existing.length > 0) {
      reporter.user_id = existing[0].id;
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, phone_number, role, is_verified, password_hash) VALUES (?, ?, ?, "MASYARAKAT", 1, ?)',
        [reporter.name, makeEmail(reporter.name), reporter.phone, DEFAULT_PASSWORD_HASH]
      );
      reporter.user_id = result.insertId;
    }
  }

  // Daftarkan 5 petugas ke database jika belum ada
  for (const petugas of PETUGAS_LIST) {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [petugas.email]);
    if (existing.length > 0) {
      petugas.user_id = existing[0].id;
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, phone_number, role, is_verified, kelurahan_id, is_on_duty, password_hash) VALUES (?, ?, ?, "PETUGAS", 1, 2, 1, ?)',
        [petugas.name, petugas.email, petugas.phone, DEFAULT_PASSWORD_HASH]
      );
      petugas.user_id = result.insertId;
    }
  }

  const startDate = new Date('2026-06-01T00:00:00+07:00');
  const endDate = new Date('2026-08-18T23:59:59+07:00');
  
  // Hapus data dummy sebelumnya yang kita buat dengan alamat 'Area Plaju Darat'
  await pool.query("DELETE FROM reports WHERE address = 'Area Plaju Darat'");

  let reports = [];
  const totalReports = 56;

  for (let i = 0; i < totalReports; i++) {
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    const reportTime = getRandomTime(new Date(randomTime), 8, 22);
    
    const reporter = getRandomReporter();
    const coords = getRandomCoordinate();
    
    reports.push({
      user_id: reporter.user_id,
      guest_name: reporter.name,
      contact: reporter.phone,
      fire_latitude: coords.lat,
      fire_longitude: coords.lng,
      created_at: reportTime,
      media_url: getRandomImage(),
      status: 'completed',
      is_fake: false
    });
  }

  // Pick exactly 13 to be fake reports
  // Shuffle first
  reports = reports.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < 13; i++) {
    reports[i].is_fake = true;
    reports[i].media_url = null;
    reports[i].status = 'false_report';
    reports[i].user_id = null; // Fake reports are guests
    
    // Ganti pelapor jadi orang iseng/anonim
    const fakeReporter = FAKE_REPORTERS[Math.floor(Math.random() * FAKE_REPORTERS.length)];
    reports[i].guest_name = fakeReporter.name;
    reports[i].contact = fakeReporter.phone;
    
    // Beri deskripsi palsu/iseng
    reports[i].description = FAKE_DESCRIPTIONS[Math.floor(Math.random() * FAKE_DESCRIPTIONS.length)];
  }

  // Untuk laporan real (sisanya), beri deskripsi bervariasi
  for (let i = 13; i < reports.length; i++) {
    reports[i].description = REAL_DESCRIPTIONS[Math.floor(Math.random() * REAL_DESCRIPTIONS.length)];
  }
  
  // Sort by created_at again
  reports.sort((a, b) => a.created_at - b.created_at);
  
  // Insert into DB
  try {
    for (const r of reports) {
      let dispatched_at = null;
      let accepted_at = null;
      let arrived_at = null;
      let completed_at = null;
      let response_time_seconds = null;
      
      if (!r.is_fake) {
        // Timeline:
        // accepted 1-5 mins later
        const accepted = new Date(r.created_at.getTime() + (1 + Math.random() * 4) * 60000);
        // dispatched 1-3 mins after accepted
        const dispatched = new Date(accepted.getTime() + (1 + Math.random() * 2) * 60000);
        // arrived 5-15 mins after dispatched
        const arrived = new Date(dispatched.getTime() + (5 + Math.random() * 10) * 60000);
        // completed 15-60 mins after arrived
        const completed = new Date(arrived.getTime() + (15 + Math.random() * 45) * 60000);
        
        accepted_at = formatDate(accepted);
        dispatched_at = formatDate(dispatched);
        arrived_at = formatDate(arrived);
        completed_at = formatDate(completed);
        
        // response time = arrived - created
        response_time_seconds = Math.floor((arrived.getTime() - r.created_at.getTime()) / 1000);
      }
      
      const query = `
        INSERT INTO reports (
          user_id, guest_name, contact, fire_latitude, fire_longitude, 
          reporter_latitude, reporter_longitude, description, address,
          media_url, status, category_id, kelurahan_id, created_at, updated_at,
          status_petugas, dispatched_at, accepted_at, arrived_at, completed_at,
          response_time_seconds, assigned_petugas_id
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, 1, 2, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?
        )
      `;
      
      const statusPetugas = r.is_fake ? 'false_report' : 'completed';
      // Tugaskan ke salah satu dari 5 petugas secara acak
      const randomPetugas = PETUGAS_LIST[Math.floor(Math.random() * PETUGAS_LIST.length)];
      const assignedPetugasId = randomPetugas.user_id;
      
      await pool.query(query, [
        r.user_id, r.guest_name, r.contact, r.fire_latitude, r.fire_longitude,
        r.fire_latitude, r.fire_longitude, r.description, 'Area Plaju Darat',
        r.media_url, r.status, formatDate(r.created_at), formatDate(r.created_at),
        statusPetugas, dispatched_at, accepted_at, arrived_at, completed_at,
        response_time_seconds, assignedPetugasId
      ]);
    }
    
    console.log(`Successfully inserted ${reports.length} reports (${13} fake, ${reports.length - 13} real).`);
  } catch (e) {
    console.error('Error inserting data:', e);
  } finally {
    process.exit(0);
  }
}

main();

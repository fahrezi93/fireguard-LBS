export interface FireStation {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
}

// Data lengkap untuk pos damkar di Kelurahan Plaju (Terverifikasi)
// Data ini telah diverifikasi berdasarkan lokasi resmi kantor kelurahan di wilayah Kecamatan Plaju
export const fireStations: FireStation[] = [
  {
    name: "Kantor Kelurahan Plaju Ulu",
    latitude: -2.9956005851459295,
    longitude: 104.81397382787074,
    address: "Jl. D.I. Panjaitan No.39, Plaju Ulu, Kec. Plaju, Kota Palembang",
    phone: "113",
  },
  {
    name: "Kantor Lurah Plaju Ilir",
    latitude: -2.9960452419172015,
    longitude: 104.81803333395953,
    address: "Plaju Ilir, Kec. Plaju, Kota Palembang",
    phone: "113",
  },
  {
    name: "Kantor Lurah Tegal Binangun, Plaju Darat",
    latitude: -3.017507003815526,
    longitude: 104.80998084506518,
    address: "Lr. Swadaya / Jl. Tegal Binangun, Plaju Darat, Kec. Plaju, Kota Palembang",
    phone: "113",
  },
  {
    name: "Kantor Kelurahan Talang Bubuk",
    latitude: -3.0065295694272423,
    longitude: 104.80762446636636,
    address: "Jl. Perguruan Dalam No.555, RT.07a/RW.02, Talang Bubuk, Kec. Plaju, Kota Palembang",
    phone: "113",
  },
  {
    name: "Kantor Kelurahan Talang Putri",
    latitude: -3.017146175818114,
    longitude: 104.82686386834816,
    address: "Sungai Pinang / Batas Talang Putri, Kec. Plaju, Kota Palembang",
    phone: "113",
  },
  {
    name: "Kantor Lurah Komperta",
    latitude: -2.993343856272282,
    longitude: 104.82092573581042,
    address: "Komperta, Kec. Plaju, Kota Palembang",
    phone: "113",
  }
];
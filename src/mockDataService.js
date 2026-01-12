import { rawUserData } from './rawUserData';

export const getMockData = () => {
  // Беремо останні 4 записи для демо
  const demoData = rawUserData.slice(-4);

  // Мапимо українські ключі на ключі додатку
  return demoData.map(item => ({
    id: item.Date,
    Date: item.Date,
    weight: item['вага'],
    height: item['зріст'],
    neck: item['шия'],
    chest: item['груди'],
    biceps: item['рука'],
    wrist: item['кість'],
    belly: item['живіт'],
    hips: item['сидниці'],
    thigh: item['стегно'],
    calf: item['гомілка'],
    note: item['Примітка']
  })).sort((a, b) => new Date(b.Date) - new Date(a.Date));
};

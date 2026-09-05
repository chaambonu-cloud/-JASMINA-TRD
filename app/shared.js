/* JASMINA TRD — saytdagi index.html dan olingan umumiy yordamchi funksiyalar.

   Mini App sayt bilan bir xil formatlash, bank/valyuta/xato matnlaridan foydalanadi. */

const DEADLINE_RE = /@@DL:([^@]+)@@/;
let globalPaid = {amount:0, unit:"so'm"};



const CURRENCIES = {
  UZS:{code:"UZS", name:"so'm",        grid:"SO'M",   short:"so'm",   locale:"ru-RU", prefix:"",  suffix:" so'm"},
  RUB:{code:"RUB", name:"rubl",        grid:"RUBL",   short:"₽",      locale:"ru-RU", prefix:"",  suffix:" ₽"},
  USD:{code:"USD", name:"dollar",      grid:"DOLLAR", short:"$",      locale:"en-US", prefix:"$", suffix:""},
  TRY:{code:"TRY", name:"turk lirasi", grid:"LIRA",   short:"₺",      locale:"en-US", prefix:"₺", suffix:""},
  TJS:{code:"TJS", name:"somoni",      grid:"SOMONI", short:"somoni", locale:"ru-RU", prefix:"",  suffix:" somoni"},
  KZT:{code:"KZT", name:"tenge",       grid:"TENGE",  short:"₸",      locale:"ru-RU", prefix:"",  suffix:" ₸"},
  KGS:{code:"KGS", name:"som",         grid:"SOM",    short:"som",    locale:"ru-RU", prefix:"",  suffix:" som"},
  EUR:{code:"EUR", name:"yevro",       grid:"YEVRO",  short:"€",      locale:"en-US", prefix:"€", suffix:""}
};

const COUNTRIES = {
  "O'ZBEKISTON":"O'zbekiston",
  "ROSSIYA":"Rossiya",
  "TOJIKISTON":"Tojikiston",
  "QOZOGISTON":"Qozog'iston",
  "QIRGIZISTON":"Qirg'iziston",
  "TURKIYA":"Turkiya"
};

const BANKS_BY_COUNTRY = {
  "O'ZBEKISTON":[
    ["uzcard","Uzcard"],["humo","Humo"],["visa","Visa"],["mastercard","Mastercard"],
    ["nbu","NBU (Milliy bank)"],
    ["kapitalbank","Kapitalbank"],["ipakyoli","Ipak Yo'li"],["hamkorbank","Hamkorbank"],
    ["anorbank","Anorbank"],["tbcuz","TBC Uzbekistan"]
  ],
  "ROSSIYA":[
    ["sberbank","Sberbank"],["tbank","T-Bank"],["vtb","VTB"],["alfabank","Alfa-Bank"],
    ["gazprombank","Gazprombank"],["visa","Visa"],["mastercard","Mastercard"],["mir","MIR"]
  ],
  "TOJIKISTON":[
    ["alif","Alif"],["dushanbecity","Dushanbe City"],["eskhata","Eskhata"],
    ["amonatbank","Amonatbank"],["visa","Visa"],["mastercard","Mastercard"]
  ],
  "QOZOGISTON":[
    ["kaspi","Kaspi Bank"],["halyk","Halyk Bank"],["forte","ForteBank"],
    ["visa","Visa"],["mastercard","Mastercard"]
  ],
  "QIRGIZISTON":[
    ["optima","Optima Bank"],["demirbank","Demir Bank"],["mbank","MBank"],
    ["visa","Visa"],["mastercard","Mastercard"]
  ],
  "TURKIYA":[
    ["ziraat","Ziraat Bankası"],["isbankasi","İş Bankası"],["garanti","Garanti BBVA"],
    ["akbank","Akbank"],["yapikredi","Yapı Kredi"],["visa","Visa"],["mastercard","Mastercard"]
  ]
};

function fmtNumber(value){

  const number = Number(value || 0);

  return number
    .toLocaleString("ru-RU", {maximumFractionDigits:2})
    .replace(/\u00a0/g, " ");
}

function curInfo(code){
  const key = String(code || "").trim().toUpperCase();
  return CURRENCIES[key] || CURRENCIES.UZS;
}

function fmtMoney(value, code){

  const info = curInfo(code);

  const raw = Number(value || 0);

  /* Kasr qismi bo'lsa har doim 2 xona ko'rsatiladi: 42.4 → 42.40 */
  const number = raw
    .toLocaleString(info.locale, {
      minimumFractionDigits: (raw % 1 === 0) ? 0 : 2,
      maximumFractionDigits: 2
    })
    .replace(/\u00a0/g, " ");

  return info.prefix + number + info.suffix;
}

function fmtGlobalPaid(){
  return fmtNumber(globalPaid.amount) + " " + globalPaid.unit;
}

function fmtSum(value){
  return fmtMoney(value, "UZS");
}

function fmtRub(value){
  return fmtMoney(value, "RUB");
}

function countryLabel(code){
  const key = String(code || "").trim().toUpperCase();
  return COUNTRIES[key] || (code ? String(code) : "—");
}

function bankName(key){

  const wanted = String(key || "").trim();

  if(!wanted){
    return "";
  }

  for(const country in BANKS_BY_COUNTRY){
    const found = BANKS_BY_COUNTRY[country].find(function(row){
      return row[0] === wanted;
    });
    if(found){
      return found[1];
    }
  }

  return wanted;
}

function bankLogo(key){
  return "../logos/" + String(key || "").trim() + ".svg";
}

function cardDigits(value){

  let text = String(value || "");
  const at = text.indexOf("#");

  if(at > -1){
    text = text.slice(at + 1);
  }

  return text.replace(/\D/g, "").slice(-4);
}

function bankFromCard(value){

  const text = String(value || "");
  const at = text.indexOf("#");

  return at > -1 ? text.slice(0, at).trim() : "";
}

function userBank(user){

  const direct = String((user && user.bank) || "").trim();

  return direct || bankFromCard(user && user.card_last4);
}

function noteText(note){
  return String(note || "").replace(DEADLINE_RE, "").trim();
}

function noteDeadline(note){
  const found = DEADLINE_RE.exec(String(note || ""));
  return found ? found[1].trim() : "";
}

function userDeadline(user){

  const direct = String((user && user.prize_deadline) || "").trim();

  return direct || noteDeadline(user && user.note);
}

function maskCard(value){

  const digits = cardDigits(value);

  return digits
    ? "**** **** **** " + digits
    : "**** **** **** ****";
}

function maskSensitive(text){

  return String(text == null ? "" : text)
    .replace(/\d[\d\s\-()]{6,}\d/g, function(match){

      const digits = match.replace(/[^0-9]/g, "");

      if(digits.length < 8){ return match; }

      return digits.slice(0, 3) +
        " " + "\u2022".repeat(digits.length - 5) +
        " " + digits.slice(-2);
    });
}

function escapeHtml(text){

  return String(text == null ? "" : text)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

function translateError(raw){

  /* Bazadan kelgan yangilanish (maintenance) xabari — matn app_settings'da */
  const maint = raw.match(/MAINTENANCE:([\s\S]*)/);
  if(maint){
    const msg = maint[1].trim();
    return msg || "Ma'lumotlar bazasi yangilanmoqda. Iltimos, keyinroq qayta kiring.";
  }

  const blocked = raw.match(/TOO_MANY_ATTEMPTS_(\d+)/);
  if(blocked){
    return "Juda ko'p noto'g'ri urinish. " + blocked[1] + " daqiqadan keyin qayta urinib ko'ring.";
  }
  if(raw.indexOf("TOO_MANY_ATTEMPTS") > -1){
    return "Juda ko'p noto'g'ri urinish. Birozdan keyin qayta urinib ko'ring.";
  }
  if(raw.indexOf("CODE_TOO_SHORT") > -1){
    return "Kirish kodi kamida 6 belgidan bo'lishi kerak.";
  }
  if(raw.indexOf("CODE_INVALID") > -1){
    return "Kirish kodida faqat raqam va harf bo'lishi mumkin.";
  }
  if(raw.indexOf("PASSWORD_TOO_SHORT") > -1){
    return "Yangi parol kamida 12 belgidan bo'lishi kerak.";
  }
  if(raw.indexOf("LOGIN_FAILED") > -1){
    return "Familiya, ism yoki kirish kodi noto'g'ri.";
  }
  if(raw.indexOf("ADMIN_PASSWORD_INVALID") > -1){
    return "Admin paroli noto'g'ri.";
  }
  if(raw.indexOf("ADMIN_SESSION_INVALID") > -1){
    return "Admin sessiyasi tugagan, qaytadan kiring.";
  }
  if(raw.indexOf("duplicate key") > -1 && raw.indexOf("code") > -1){
    return "Bu kirish kodi allaqachon band. Boshqa kod tanlang.";
  }
  if(raw.indexOf("NAME_REQUIRED") > -1){
    return "Familiya va ism majburiy.";
  }
  if(raw.indexOf("CODE_REQUIRED") > -1){
    return "Kirish kodi majburiy.";
  }
  if(raw.indexOf("USER_NOT_FOUND") > -1){
    return "Foydalanuvchi topilmadi.";
  }
  if(raw.indexOf("DEPOSIT_ALREADY_CREDITED") > -1){
    return "Bu tranzaksiya allaqachon balansga qo'shilgan.";
  }
  if(raw.indexOf("DEPOSIT_ALREADY_DECIDED") > -1){
    return "Bu tranzaksiya bo'yicha qaror allaqachon qabul qilingan.";
  }
  if(raw.indexOf("DEPOSIT_NOT_FOUND") > -1){
    return "To'lov so'rovi topilmadi.";
  }
  if(raw.indexOf("BALANCE_REASON_REQUIRED") > -1){
    return "Balansni qo'lda o'zgartirish uchun sabab yozish shart.";
  }
  if(raw.indexOf("TOO_MANY_PENDING") > -1){
    return "Sizda tasdiqlanmagan to'lov so'rovlari juda ko'p. Avval ularni yakunlang.";
  }
  if(raw.indexOf("AMOUNT_TOO_BIG") > -1){
    return "Summa juda katta.";
  }
  if(raw.indexOf("AMOUNT_REQUIRED") > -1){
    return "To'ldirish summasini kiriting.";
  }
  if(raw.indexOf("METHOD_CURRENCY_MISMATCH") > -1){
    return "Tanlangan rekvizit valyutasi tanlangan valyutaga mos emas.";
  }
  if(raw.indexOf("FX_RATE_MISSING") > -1){
    return "Bu valyuta uchun kurs sozlanmagan. Admin bilan bog'laning.";
  }
  if(raw.indexOf("FX_CURRENCY_REQUIRED") > -1){
    return "Valyutani tanlang.";
  }
  if(raw.indexOf("FX_CODE_INVALID") > -1){
    return "Valyuta kodi noto'g'ri (3 ta harf bo'lishi kerak).";
  }
  if(raw.indexOf("FX_RATE_INVALID") > -1){
    return "Kurs qiymati noto'g'ri.";
  }
  if(raw.indexOf("FX_BASE_LOCKED") > -1){
    return "USD asosiy valyuta — uni o'chirib bo'lmaydi.";
  }
  if(raw.indexOf("METHOD_NOT_FOUND") > -1){
    return "To'lov rekviziti topilmadi.";
  }
  if(raw.indexOf("CARD_EXISTS") > -1){
    return "Bu karta allaqachon qo'shilgan.";
  }
  if(raw.indexOf("CARD_LIMIT") > -1){
    return "Ko'pi bilan 5 ta karta qo'shish mumkin.";
  }
  if(raw.indexOf("CARD_EXPIRED") > -1){
    return "Bu kartaning amal qilish muddati tugagan.";
  }
  if(raw.indexOf("CARD_NOT_FOUND") > -1){
    return "Karta topilmadi.";
  }
  if(raw.indexOf("CARD_EXP_INVALID") > -1){
    return "Kartaning amal qilish muddatini OO/YY ko'rinishida kiriting.";
  }
  if(raw.indexOf("CARD_INVALID") > -1){
    return "Karta raqamini to'liq va to'g'ri kiriting.";
  }
  if(raw.indexOf("RECEIPT_TOO_BIG") > -1){
    return "Chek rasmi juda katta. Kichikroq screenshot yuboring.";
  }
  if(raw.indexOf("RECEIPT_INVALID") > -1){
    return "Chek faqat rasm (PNG/JPG) bo'lishi kerak.";
  }
  if(raw.indexOf("Could not find the function") > -1 || raw.indexOf("PGRST202") > -1){
    return "Baza yangilanmagan. Admin Supabase SQL Editor'da ro'yxatdan o'tish so'rovlari faylini ishga tushirishi kerak.";
  }
  if(raw.indexOf("COUNTRY_REQUIRED") > -1){
    return "Davlatni tanlang.";
  }
  if(raw.indexOf("CITY_REQUIRED") > -1){
    return "Shaharni kiriting.";
  }
  if(raw.indexOf("ADDRESS_SHORT") > -1){
    return "Manzil juda qisqa. Ko'cha nomi va uy raqamini to'liq yozing.";
  }
  if(raw.indexOf("ADDRESS_NO_NUMBER") > -1){
    return "Manzilda uy raqami ko'rsatilmagan. Masalan: Navoiy ko'chasi, 24-uy.";
  }
  if(raw.indexOf("ADDRESS_NO_STREET") > -1){
    return "Manzilda ko'cha yoki mahalla nomini yozing.";
  }
  if(raw.indexOf("ADDRESS_FAKE") > -1){
    return "Manzil haqiqiy emasga o'xshaydi. Tasodifiy harflar emas, aniq manzilni yozing.";
  }
  if(raw.indexOf("ADDRESS_REQUIRED") > -1){
    return "Manzilni to'liq kiriting.";
  }
  if(raw.indexOf("PHONE_INVALID") > -1){
    return "Telefon raqami noto'g'ri yoki to'liq emas.";
  }
  if(raw.indexOf("REQUEST_EXISTS") > -1){
    return "Bu raqam bilan so'rov allaqachon yuborilgan. Admin javobini kuting.";
  }
  if(raw.indexOf("REQUEST_NOT_FOUND") > -1){
    return "So'rov topilmadi.";
  }
  if(raw.indexOf("INVESTMENT_PENDING") > -1){
    return "Sizda tekshirilmoqda holatidagi to'lov bor. Admin javobini kuting.";
  }
  if(raw.indexOf("INVESTMENT_ACTIVE") > -1){
    return "Sizda allaqachon faol sarmoya bor.";
  }
  if(raw.indexOf("PACKAGE_NOT_FOUND") > -1){
    return "Paket topilmadi yoki nofaol qilingan.";
  }
  if(raw.indexOf("METHOD_NOT_FOUND") > -1){
    return "To'lov rekviziti topilmadi.";
  }
  if(raw.indexOf("AMOUNT_TOO_SMALL") > -1){
    return "Summa paketning minimal summasidan kichik.";
  }
  if(raw.indexOf("AMOUNT_REQUIRED") > -1){
    return "Summani kiriting.";
  }
  if(raw.indexOf("CURRENCY_REQUIRED") > -1){
    return "Valyutani tanlang.";
  }
  if(raw.indexOf("CARD_EXISTS") > -1){
    return "Bu karta allaqachon qo'shilgan.";
  }
  if(raw.indexOf("CARD_LIMIT") > -1){
    return "Ko'pi bilan 5 ta karta qo'shish mumkin.";
  }
  if(raw.indexOf("CARD_EXPIRED") > -1){
    return "Bu kartaning amal qilish muddati tugagan.";
  }
  if(raw.indexOf("CARD_NOT_FOUND") > -1){
    return "Karta topilmadi.";
  }
  if(raw.indexOf("CARD_EXP_INVALID") > -1){
    return "Kartaning amal qilish muddatini OO/YY ko'rinishida kiriting.";
  }
  if(raw.indexOf("CARD_INVALID") > -1){
    return "Karta raqamini to'liq va to'g'ri kiriting.";
  }
  if(raw.indexOf("RECEIPT_TOO_BIG") > -1){
    return "Chek rasmi juda katta. Kichikroq rasm yuboring.";
  }
  if(raw.indexOf("RECEIPT_INVALID") > -1){
    return "Chek fayli noto'g'ri. Faqat rasm yuboring.";
  }
  if(raw.indexOf("INVESTMENT_NOT_FOUND") > -1){
    return "Sarmoya yozuvi topilmadi.";
  }
  if(raw.indexOf("INVESTMENT_REJECTED") > -1){
    return "Bu to'lov rad etilgan. Qaytadan so'rov yuboring.";
  }
  if(raw.indexOf("STAGE_INVALID") > -1){
    return "Bosqich qiymati noto'g'ri.";
  }
  if(raw.indexOf("CARD_REQUIRED") > -1){
    return "Karta / hisob raqamini kiriting.";
  }
  return raw;
}

function depBadge(status){

  const map = {
    pending: "KUTILMOQDA",
    paid: "TASDIQLANGAN",
    failed: "RAD ETILGAN",
    canceled: "BEKOR QILINGAN"
  };

  const key = map[status] ? status : "pending";

  return '<span class="dep-badge ' + key + '">' + map[key] + "</span>";
}

function invTimelineHtml(state){

  const active = state.status === "active";
  const stage = String(state.stage || "");

  const steps = [
    {t:"So'rov yuborildi", done:true},
    {t:"To'lov tasdiqlandi", done:active},
    {t:"Jarayonda", done:active && (stage === "progress" || stage === "result")},
    {t:"Natija tayyor", done:active && stage === "result"}
  ];

  let currentSet = false;

  return steps.map(function(step){

    let cls = step.done ? "done" : "";

    if(!step.done && !currentSet){
      cls = "now";
      currentSet = true;
    }

    return '<div class="inv-step ' + cls + '"><i></i>' + escapeHtml(step.t) + "</div>";

  }).join("");
}

function fxText(from, to, rate){

  const value = Number(rate || 0);

  if(!value){ return ""; }

  const a = String(from).toUpperCase();
  const b = String(to).toUpperCase();

  if(a === b){ return ""; }

  if(value >= 1){
    return "kurs 1 " + a + " = " + fmtNumber(Math.round(value * 10000) / 10000) + " " + b;
  }

  return "kurs 1 " + b + " = " + fmtNumber(Math.round(100 / value) / 100) + " " + a;
}

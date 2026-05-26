// API Response Types
export interface ApiResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: T[];
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// Place Item Types
export interface PlaceItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2?: string;
  tel?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx: string;
  mapy: string;
  mlevel?: string;
  areacode?: string;
  sigungucode?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  createdtime?: string;
  modifiedtime?: string;
  booktour?: string;
  dist?: string;
}

// Detail Common
export interface DetailCommon {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2?: string;
  zipcode?: string;
  tel?: string;
  telname?: string;
  homepage?: string;
  firstimage?: string;
  firstimage2?: string;
  overview?: string;
  mapx: string;
  mapy: string;
  mlevel?: string;
}

// Detail Pet Tour
export interface DetailPetTour {
  contentid: string;
  petcominfo?: string;
  relaAcdntRiskMtr?: string;
  acmpyTypeCd?: string;
  relaPosesFclty?: string;
  relaFrnshPrdlst?: string;
  etcAcmpyInfo?: string;
  relaPurcPrdlst?: string;
  acmpyPsblCpam?: string;
  relaRntlPrdlst?: string;
  acmpyNeedMtr?: string;
  relaBrkfst?: string;
  relaPatpos?: string;
  relaMeditm?: string;
  relaAcdntInfo?: string;
  relaPetPla?: string;
  relaFacltySttus?: string;
}

// Detail Image
export interface DetailImage {
  contentid: string;
  originimgurl: string;
  smallimageurl: string;
  serialnum?: string;
}

// Detail Intro (숙박)
export interface DetailIntroAccommodation {
  contentid: string;
  contenttypeid: string;
  accomcountlodging?: string;
  benikia?: string;
  checkintime?: string;
  checkouttime?: string;
  chkcooking?: string;
  foodplace?: string;
  goodstay?: string;
  hanok?: string;
  infocenterlodging?: string;
  parkinglodging?: string;
  pickup?: string;
  roomcount?: string;
  reservationlodging?: string;
  reservationurl?: string;
  roomtype?: string;
  scalelodging?: string;
  subfacility?: string;
  barbecue?: string;
  beauty?: string;
  beverage?: string;
  bicycle?: string;
  campfire?: string;
  fitness?: string;
  karaoke?: string;
  publicbath?: string;
  publicpc?: string;
  sauna?: string;
  seminar?: string;
  sports?: string;
  refundregulation?: string;
}

// Detail Info (숙박)
export interface DetailInfoAccommodation {
  contentid: string;
  contenttypeid: string;
  fldgubun?: string;
  infoname?: string;
  infotext?: string;
  serialnum?: string;
}

// Area Code
export interface AreaCode {
  code: string;
  name: string;
  rnum?: number;
}

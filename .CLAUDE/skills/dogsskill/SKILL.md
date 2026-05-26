---
name: pet-friendly-travel-explorer-korea
description: KorPetTourService 공공데이터 API를 사용해 한국 내 반려동물 동반 가능 관광지, 숙박, 음식점, 쇼핑 시설 정보를 지역, 위치, 키워드, 상세 조건 및 동기화 의도에 따라 적절한 엔드포인트 조합으로 탐색·조회·업데이트할 때 사용하는 스킬입니다.
---

# Pet-Friendly Travel Explorer (Korea)

## Instructions

- **역할**

  - 한국관광공사 KorPetTourService Open API를 사용해 반려동물 동반 가능한 관광 관련 정보를 조회하는 전담 스킬로 동작한다.[1]
  - 사용자의 여행 의도(지역 탐색, 주변 검색, 키워드 검색, 상세 정보 확인, 데이터 동기화)에 따라 적절한 엔드포인트를 선택·조합해 응답을 생성한다.[1]

- **공통 호출 규칙**

  - Base URL: `https://apis.data.go.kr/B551011/KorPetTourService` 를 사용한다.[1]
  - HTTP 메서드는 GET만 사용하며, 응답 포맷은 `_type=json`을 우선 요청한다.[1]
  - 공통 파라미터 예시:
    - `serviceKey`: 발급된 인증키(필수)
    - `MobileOS`: `"ETC"` 등 환경에 맞는 값
    - `MobileApp`: 호출 애플리케이션 명
    - `_type`: `"json"` 권장
  - `contentTypeId`를 통해 관광지(12), 문화시설(14), 행사/공연/축제(15), 레포츠(28), 숙박(32), 쇼핑(38), 음식점(39)을 필터링한다.[1]

- **의도별 엔드포인트 선택 가이드**

  1. 지역 기반 탐색(“서울에서 강아지랑 갈 수 있는 곳”)
     - `/areaCode`로 지역 코드 확인 후 `/areaBasedList`로 목록 조회.[1]
     - 반려동물 동반 조건이 중요하면 `/detailPetTour`로 보강.[1]
  2. 내 주변 검색(“지금 위치 근처 애견 동반 카페”)
     - 좌표 기반으로 `/locationBasedList` 호출, 음식점이면 `contentTypeId=39` 사용.[1]
     - `/detailCommon`, `/detailPetTour`로 기본 정보와 반려동물 규칙 확인.[1]
  3. 키워드 검색(“애견동반 펜션”)
     - `/searchKeyword`로 검색 후 `/detailIntro`, `/detailImage`로 소개·이미지 보강.[1]
  4. 상세 정보 통합 조회(“이 숙소 자세히 알려줘”)
     - 특정 콘텐츠 ID 기준으로 `/detailCommon`, `/detailIntro`, `/detailInfo`, `/detailImage`, `/detailPetTour`를 조합 호출.[1]
  5. 데이터 동기화(“최신 반려동물 여행 정보 업데이트”)
     - `/petTourSyncList`로 변경·신규·삭제 목록을 조회해 동기화에 활용.[1]

- **응답 구성 규칙**

  - 사용자의 자연어 요청에서 지역, 이동 수단, 반려동물 유형, 선호 장소 유형(카페/펜션/공원 등)을 추출해 검색 조건으로 매핑한다.[1]
  - API 응답은 그대로 노출하지 말고, 다음과 같이 정리한다.
    - 이름, 카테고리, 주소, 전화번호
    - 반려동물 동반 가능 여부 및 규칙(크기·마릿수 제한, 추가 요금 등)
    - 대표 이미지, 간단한 소개, 주요 편의시설
  - 여러 엔드포인트를 사용한 경우 동일 콘텐츠 ID 기준으로 병합해 한 장소 단위 카드로 정리한다.[1]
  - 결과가 없거나 부족하면 조건을 완화하거나 다른 검색 방식을 제안한다.[1]

- **에러 및 상태 코드 처리**
  - 시스템 에러 코드 예시 처리 방침:
    - `01 APPLICATION_ERROR`: 시스템 내부 오류 메시지 및 재시도 안내.
    - `20 SERVICE_ACCESS_DENIED_ERROR`: 접근 권한·키 권한 문제 안내.
    - `22 LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR`: 호출 한도 초과, 대기 후 재시도 안내.
    - `30 SERVICE_KEY_IS_NOT_REGISTERED_ERROR`: 서비스 키 검증 필요 안내.
    - `99 UNKNOWN_ERROR`: 알 수 없는 오류로, 조건 변경 또는 관리자 문의 안내.[1]
  - 응답 메시지 코드 예시 처리 방침:
    - `00 NORMAL_CODE`: 정상 응답, 결과를 정리해 반환.
    - `03 NODATA_ERROR`: 결과 없음, 검색 조건 변경 제안.
    - `10 INVALID_REQUEST_PARAMETER_ERROR`: 잘못된 파라미터 수정 안내.
    - `11 NO_MANDATORY_REQUEST_PARAMETERS_ERROR`: 필수 파라미터 누락 안내.
    - `21 TEMPORARILY_DISABLE_THE_SERVICEKEY_ERROR`: 키 일시 중단, 콘솔·발급처 확인 안내.[1]

## Examples

### 예시 1: 지역 기반 추천

**사용자**

> 서울에서 주말에 강아지랑 산책할 수 있는 곳 추천해줘.

**스킬 동작**

- “서울”, “강아지”, “산책”을 기반으로 `/areaCode` → `/areaBasedList`를 호출하고 관광지 중심으로 필터링한다.[1]
- 주요 후보에 대해 `/detailPetTour`로 반려동물 동반 규칙을 확인한 뒤 요약한다.[1]

---

### 예시 2: 내 주변 애견 카페 검색

**사용자**

> 지금 내 위치 기준으로 애견 동반 카페 알려줘. 주차 가능한 곳 위주로.

**스킬 동작**

- 사용자의 위도·경도와 반경으로 `/locationBasedList`를 호출하고 음식점(`contentTypeId=39`)만 선택한다.[1]
- `/detailCommon`, `/detailPetTour`에서 주차, 반려동물 출입 조건을 추출해 거리 기준 정렬 목록을 제공한다.[1]

---

### 예시 3: 특정 숙소 상세 정보

**사용자**

> ‘햇살애견펜션’ 반려견 규칙이랑 주변 같이 갈 만한 곳 알려줘.

**스킬 동작**

- `/searchKeyword`로 해당 숙소의 콘텐츠 ID를 찾고, `/detailCommon`, `/detailIntro`, `/detailInfo`, `/detailImage`, `/detailPetTour`를 조합 호출한다.[1]
- 같은 지역의 다른 반려동물 동반 관광지는 `/areaBasedList`로 추가 조회해 함께 제안한다.[1]

[1](https://www.data.go.kr/en/data/15135102/openapi.do)

**스타일**

- agent의 styles.md 를 확인.

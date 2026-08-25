# 데이터 출처 및 수집 방법

## 데이터 설명

- 배포 기관: Meteostat
- 관측소: 서울(관측소 ID 및 WMO 번호 `47108`)
- 좌표: 위도 37.5667, 경도 126.9667
- 기간: 2025-01-01 – 2025-12-31
- 데이터 수: 365행
- 파일: `seoul_47108_2025_daily.csv`
- 주요 항목: 평균기온(`temp`), 최저기온(`tmin`), 최고기온(`tmax`)
- 단위: 섭씨(°C)

## 다운로드

```bash
curl -L -o data/seoul_47108_2025_daily.csv.gz \
  https://data.meteostat.net/daily/2025/47108.csv.gz
gzip -dk data/seoul_47108_2025_daily.csv.gz
```

## 출처

- 일자료 설명: https://dev.meteostat.net/data/timeseries/daily
- 서울 관측소 정보: https://meteostat.net/en/station/47108
- 원본 다운로드: https://data.meteostat.net/daily/2025/47108.csv.gz

## 라이선스 및 주의사항

Meteostat가 재배포하는 데이터에는 Creative Commons Attribution 4.0(CC BY 4.0) 라이선스가 적용됩니다. 결과물을 공개할 때 Meteostat와 원 데이터 제공자를 표시해야 합니다.

일자료에는 관측자료뿐 아니라 관측값이 없을 때 이를 대체한 모델 자료가 포함될 수 있습니다. `temp_source`, `tmin_source`, `tmax_source` 컬럼에서 각 값의 원자료 출처 코드를 확인할 수 있습니다. 따라서 이 데이터는 특정 날짜의 기상청 공식 관측값과 일부 차이가 있을 수 있으며, 이 점을 분석의 한계로 기록합니다.

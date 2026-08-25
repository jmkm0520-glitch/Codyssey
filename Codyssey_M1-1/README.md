# Seoul Temperature Analysis

2025년 서울 일별 기온 변화와 계절별 특징을 분석하는 프로젝트입니다.

- 분석 지역: 서울
- 분석 기간: 2025-01-01 – 2025-12-31
- 데이터 배포 기관: Meteostat
- 데이터 종류: 관측소별 일자료, 서울/WMO 관측소 47108
- 데이터 출처: [Meteostat 일자료 다운로드 설명](https://dev.meteostat.net/data/timeseries/daily)
- 원본 다운로드: `https://data.meteostat.net/daily/2025/47108.csv.gz`
- 라이선스: CC BY 4.0 (Meteostat와 원 데이터 제공자 출처표시 필요)

## 분석 질문

1. 일평균기온은 시간에 따라 어떻게 변했는가?
2. 가장 더웠던 날과 가장 추웠던 날은 언제인가?
3. 월별 평균기온과 평균 일교차에는 어떤 차이가 있는가?
4. 전날보다 평균기온이 급격하게 변한 시기는 언제인가?

## 폴더 구성

```text
seoul-temperature-analysis/
├── data/             # 원본 또는 정리된 데이터
├── images/           # 분석 그래프
├── analysis.py       # 분석 코드
├── REPORT.md         # 최종 분석 리포트
├── README.md         # 프로젝트 및 실행 방법
└── requirements.txt  # Python 의존성
```

## 실행 방법

### 1. 실행 환경

- Python 3.10 이상
- 확인한 환경: Python 3.12.13

### 2. 라이브러리 설치

```bash
python -m pip install -r requirements.txt
```

### 3. 분석 실행

```bash
python analysis.py
```

스크립트는 데이터를 정제하고 시계열 지표를 계산한 뒤 그래프 3개를 생성합니다.

## 결과 파일

- 분석 리포트: `REPORT.md`
- 일평균기온과 7일 이동평균: `images/01_daily_temperature_trend.png`
- 월별 평균기온: `images/02_monthly_average_temperature.png`
- 월별 평균 일교차: `images/03_temperature_change.png`

## 데이터 수집

```bash
curl -L -o data/seoul_47108_2025_daily.csv.gz \
  https://data.meteostat.net/daily/2025/47108.csv.gz
gzip -dk data/seoul_47108_2025_daily.csv.gz
```

자세한 출처와 이용 주의사항은 `data/README.md`를 확인하세요.

데이터를 다시 내려받지 않아도 저장소에 포함된 CSV로 분석을 실행할 수 있습니다. 원본을 다시 수집할 경우 위 명령을 프로젝트 최상위 폴더에서 실행하세요.

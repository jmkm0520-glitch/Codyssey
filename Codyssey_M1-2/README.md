# 온라인 쇼핑몰 매출 분석 AI

영국 온라인 소매 거래 데이터를 일별 매출로 분석하고, 저장된 요약 정보를 바탕으로 질문에 답하는 AI 서비스입니다.

## 데이터 출처

- 데이터셋: [UCI Machine Learning Repository — Online Retail](https://archive.ics.uci.edu/dataset/352/online+retail)
- 인용: Chen, D. (2015). *Online Retail* [Dataset]. UCI Machine Learning Repository.
- DOI: [10.24432/C5BW33](https://doi.org/10.24432/C5BW33)
- 라이선스: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- 거래 기간: 2010-12-01 ~ 2011-12-09
- 규모: 541,909개 거래 행
- 업체 정보: 영국에 등록된 비점포 온라인 소매업체이며, 업체명은 공개되지 않았습니다.
- 고객 정보: 고객은 이름 대신 숫자형 `CustomerID`로 구분됩니다.

원본 파일은 `data/Online Retail.xlsx`에 로컬로 보관하며, 용량과 재배포 관리를 위해 Git 추적 대상에서 제외합니다.

### 확인한 원본 필드

| 필드 | 의미 |
| --- | --- |
| `InvoiceNo` | 거래 송장 번호 |
| `Description` | 상품 설명 |
| `Quantity` | 거래별 상품 수량 |
| `InvoiceDate` | 거래 생성 날짜와 시간 |
| `UnitPrice` | 상품 한 개당 가격(파운드) |
| `Country` | 고객 거주 국가 |

원본에는 위 필드 외에도 `StockCode`, `CustomerID`가 포함되어 있습니다.

## 데이터 전처리

다음 기준으로 원본 거래를 정제합니다.

1. `InvoiceNo`가 `C`로 시작하는 취소 거래를 제외합니다.
2. `Quantity`가 0 이하인 반품·비정상 거래를 제외합니다.
3. `UnitPrice`가 0 이하인 무료·비정상 거래를 제외합니다.
4. `InvoiceNo`, `Description`, `Quantity`, `InvoiceDate`, `UnitPrice`, `Country` 중 하나라도 비어 있는 행을 제외합니다.
5. 거래별 매출을 `Quantity × UnitPrice`로 계산하고 거래 날짜별로 합산합니다.
6. 날짜별 고유 송장 수와 판매 수량 합계를 `memo`에 기록합니다.

원본 파일은 수정하지 않으며 다음 명령으로 `data/daily_sales.csv`를 다시 만들 수 있습니다.

```bash
source .venv/bin/activate
python scripts/preprocess_sales.py
```

결과는 Firestore 적재에 사용할 `date`, `value`, `memo` 세 열로 구성됩니다. `value`는 영국 파운드(GBP) 기준이며 소수점 둘째 자리로 반올림합니다.

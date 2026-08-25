# main.py 변수 자료형 정리

## 전역 변수

| 변수 | 자료형 | 의미 |
|---|---|---|
| `CATEGORIES` | `list[str]` | 프롬프트 분류에 사용할 카테고리 이름 목록 |
| `prompts` | `list[dict]` | 등록된 프롬프트 전체를 저장하는 목록 |
| `prompts[i]["title"]` | `str` | 프롬프트 제목 |
| `prompts[i]["content"]` | `str` | 프롬프트 본문 내용 |
| `prompts[i]["category"]` | `str` | 프롬프트가 속한 카테고리 |
| `prompts[i]["favorite"]` | `bool` | 즐겨찾기 등록 여부 (True/False) |

## 함수별 입력 / 출력

| 함수 | 입력(매개변수) | 의미 | 출력(반환값) | 의미 |
|---|---|---|---|---|
| `show_menu()` | 없음 | - | `str` | 사용자가 입력한 메뉴 번호 |
| `add_prompt(prompts)` | `prompts: list[dict]` | 새 프롬프트를 추가할 대상 목록 | `None` | 목록에 직접 추가(반환 없음) |
| `show_list(prompts)` | `prompts: list[dict]` | 출력할 프롬프트 목록 | `None` | 화면 출력만 수행 |
| `show_by_category(prompts)` | `prompts: list[dict]` | 필터링할 프롬프트 목록 | `None` | 화면 출력만 수행 |
| `search_prompt(prompts)` | `prompts: list[dict]` | 검색 대상 프롬프트 목록 | `None` | 화면 출력만 수행 |
| `show_detail(prompts)` | `prompts: list[dict]` | 상세 조회할 프롬프트 목록 | `None` | 화면 출력만 수행 |
| `toggle_favorite(prompts)` | `prompts: list[dict]` | 즐겨찾기 상태를 바꿀 대상 목록 | `None` | 목록 항목을 직접 수정(반환 없음) |
| `show_favorites(prompts)` | `prompts: list[dict]` | 즐겨찾기 필터링할 목록 | `None` | 화면 출력만 수행 |
| `main()` | 없음 | - | `None` | 프로그램 실행 루프 (반환 없음) |

## 함수 내부 주요 지역변수

### show_menu
| 변수 | 자료형 | 의미 |
|---|---|---|
| `input().strip()` 결과 | `str` | 사용자가 입력한 메뉴 선택 번호 문자열 |

### add_prompt
| 변수 | 자료형 | 의미 |
|---|---|---|
| `title` | `str` | 새로 입력받은 프롬프트 제목 |
| `content` | `str` | 새로 입력받은 프롬프트 내용 |
| `category` | `str` | 새로 입력받은(또는 선택한) 카테고리명 |
| `choice` | `str` | 카테고리 선택 시 입력한 번호 문자열 |
| `choice_num` | `int` | `choice`를 정수로 변환한 값 |

### show_list
| 변수 | 자료형 | 의미 |
|---|---|---|
| `i` | `int` | 목록 출력 시 번호 (1부터 시작) |
| `p` | `dict` | 순회 중인 개별 프롬프트 항목 |
| `star` | `str` | 즐겨찾기 표시 문자(⭐) 또는 빈 문자열 |

### show_by_category
| 변수 | 자료형 | 의미 |
|---|---|---|
| `category` | `str` | 사용자가 선택한 카테고리명 |
| `choice` | `str` | 카테고리 선택 시 입력한 번호 문자열 |
| `choice_num` | `int` | `choice`를 정수로 변환한 값 |
| `filtered` | `list[dict]` | 선택한 카테고리에 속하는 프롬프트만 걸러낸 목록 |
| `i` | `int` | 출력용 번호 |
| `p` | `dict` | 순회 중인 개별 프롬프트 항목 |
| `star` | `str` | 즐겨찾기 표시 문자 |

### search_prompt
| 변수 | 자료형 | 의미 |
|---|---|---|
| `keyword` | `str` | 사용자가 입력한 검색어 |
| `result` | `list[dict]` | 제목/내용에 검색어가 포함된 프롬프트 목록 |
| `i` | `int` | 출력용 번호 |
| `p` | `dict` | 순회 중인 개별 프롬프트 항목 |
| `star` | `str` | 즐겨찾기 표시 문자 |

### show_detail
| 변수 | 자료형 | 의미 |
|---|---|---|
| `number` | `str` | 상세히 볼 항목의 번호 입력값 |
| `p` | `dict` | 선택된 프롬프트 항목 |
| `star` | `str` | 즐겨찾기 표시 문자 |

### toggle_favorite
| 변수 | 자료형 | 의미 |
|---|---|---|
| `number` | `str` | 즐겨찾기를 토글할 항목의 번호 입력값 |
| `p` | `dict` | 선택된 프롬프트 항목 |
| `status` | `str` | 토글 후 상태 메시지("등록"/"해제") |

### show_favorites
| 변수 | 자료형 | 의미 |
|---|---|---|
| `favorites` | `list[dict]` | 즐겨찾기로 등록된 프롬프트만 걸러낸 목록 |
| `i` | `int` | 출력용 번호 |
| `p` | `dict` | 순회 중인 개별 프롬프트 항목 |

### main
| 변수 | 자료형 | 의미 |
|---|---|---|
| `choice` | `str` | 사용자가 선택한 메뉴 번호 |

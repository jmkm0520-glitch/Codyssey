prompts = [
    {
        "title": "회의록 요약",
        "content": "회의 내용을 핵심 요약, 결정사항, 담당자, 일정으로 정리해 주세요.",
        "category": "텍스트 생성",
        "favorite": True
    },
    {
        "title": "AI 뉴스 요약",
        "content": "AI 또는 IT 관련 뉴스를 한국어 3줄 이내로 요약해 주세요.",
        "category": "자동화",
        "favorite": False
    },
    {
        "title": "광고 영상 생성",
        "content": "30초 분량의 제품 광고 영상 스토리보드와 내레이션을 작성해 주세요.",
        "category": "영상 생성",
        "favorite": True
    }
]

def show_menu():
    """프롬프트 관리 프로그램의 메뉴를 출력한다."""
    print("\n=== 나만의 프롬프트 관리 ===")
    print("1. 프롬프트 추가")
    print("2. 프롬프트 목록")
    print("3. 카테고리별 조회")
    print("4. 프롬프트 검색")
    print("5. 프롬프트 상세 보기")
    print("6. 즐겨찾기 관리")
    print("7. 즐겨찾기 목록")
    print("0. 종료")

def show_prompt_list():
    """저장된 프롬프트 목록을 출력한다."""

    print("\n=== 프롬프트 목록 ===")

    if len(prompts) == 0:
        print("등록된 프롬프트가 없습니다.")
        return

    for index, prompt in enumerate(prompts, start=1):
        star = "⭐" if prompt["favorite"] else ""

        print(f"{index}. [{prompt['category']}] {prompt['title']} {star}")

    print(f"\n총 {len(prompts)}개의 프롬프트")

def add_prompt():
    """새로운 프롬프트를 등록한다."""

    print("\n=== 프롬프트 추가 ===")

    while True:
        title = input("제목: ").strip()

        if title:
            break

        print("제목은 비워둘 수 없습니다.")

    while True:
        content = input("내용: ").strip()

        if content:
            break

        print("내용은 비워둘 수 없습니다.")

    categories = [
        "텍스트 생성",
        "이미지 생성",
        "영상 생성",
        "페르소나",
        "자동화",
        "기타"
    ]

    print("\n카테고리 선택:")

    for index, category in enumerate(categories, start=1):
        print(f"{index}) {category}")

    while True:
        category_choice = input("선택: ").strip()

        if category_choice.isdigit():
            category_number = int(category_choice)

            if 1 <= category_number <= len(categories):
                category = categories[category_number - 1]
                break

        print("올바른 카테고리 번호를 입력해주세요.")

    new_prompt = {
        "title": title,
        "content": content,
        "category": category,
        "favorite": False
    }

    prompts.append(new_prompt)

    print("프롬프트가 추가되었습니다!")

def show_category():
    """카테고리별 프롬프트를 출력한다."""

    categories = [
        "텍스트 생성",
        "이미지 생성",
        "영상 생성",
        "페르소나",
        "자동화",
        "기타"
    ]

    print("\n=== 카테고리별 조회 ===")

    for index, category in enumerate(categories, start=1):
        print(f"{index}. {category}")

    while True:
        choice = input("선택: ").strip()

        if choice.isdigit():
            number = int(choice)

            if 1 <= number <= len(categories):
                selected_category = categories[number - 1]
                break

        print("올바른 번호를 입력해주세요.")

    print(f"\n[{selected_category}] 카테고리 프롬프트")

    count = 0

    for index, prompt in enumerate(prompts, start=1):

        if prompt["category"] == selected_category:

            star = "⭐" if prompt["favorite"] else ""

            print(f"{index}. {prompt['title']} {star}")

            count += 1

    if count == 0:
        print("해당 카테고리의 프롬프트가 없습니다.")

    else:
        print(f"\n총 {count}개의 프롬프트")

def search_prompt():
    """제목 또는 내용에 검색어가 포함된 프롬프트를 출력한다."""

    print("\n=== 프롬프트 검색 ===")

    while True:
        keyword = input("검색어: ").strip()

        if keyword:
            break

        print("검색어는 비워둘 수 없습니다.")

    results = []

    for prompt in prompts:
        if (
            keyword.lower() in prompt["title"].lower()
            or keyword.lower() in prompt["content"].lower()
        ):
            results.append(prompt)

    if len(results) == 0:
        print("검색 결과가 없습니다.")
        return

    print("\n검색 결과:")

    for index, prompt in enumerate(results, start=1):
        star = "⭐" if prompt["favorite"] else ""
        print(f"{index}. [{prompt['category']}] {prompt['title']} {star}")

    print(f"\n{len(results)}개의 프롬프트를 찾았습니다.")

def show_prompt_detail():
    """선택한 프롬프트의 상세 내용을 출력한다."""

    print("\n=== 프롬프트 상세 보기 ===")

    if len(prompts) == 0:
        print("등록된 프롬프트가 없습니다.")
        return

    while True:
        number_input = input("프롬프트 번호 입력: ").strip()

        if number_input.isdigit():
            number = int(number_input)

            if 1 <= number <= len(prompts):
                prompt = prompts[number - 1]
                break

        print("올바른 프롬프트 번호를 입력해주세요.")

    star = "⭐" if prompt["favorite"] else "아님"

    print("\n────────────────────────────")
    print(f"제목: {prompt['title']}")
    print(f"카테고리: {prompt['category']}")
    print(f"즐겨찾기: {star}")
    print("────────────────────────────")
    print("내용:")
    print(prompt["content"])
    print("────────────────────────────")

def manage_favorite():
    """선택한 프롬프트의 즐겨찾기 상태를 추가하거나 해제한다."""

    print("\n=== 즐겨찾기 관리 ===")

    if len(prompts) == 0:
        print("등록된 프롬프트가 없습니다.")
        return

    while True:
        number_input = input("프롬프트 번호 입력: ").strip()

        if number_input.isdigit():
            number = int(number_input)

            if 1 <= number <= len(prompts):
                prompt = prompts[number - 1]
                break

        print("올바른 프롬프트 번호를 입력해주세요.")

    prompt["favorite"] = not prompt["favorite"]

    if prompt["favorite"]:
        print(f"'{prompt['title']}' 프롬프트를 즐겨찾기에 추가했습니다!")
    else:
        print(f"'{prompt['title']}' 프롬프트의 즐겨찾기를 해제했습니다!")

def show_favorites():
    """즐겨찾기된 프롬프트만 출력한다."""

    print("\n=== 즐겨찾기 목록 ===")

    favorite_prompts = []

    for prompt in prompts:
        if prompt["favorite"]:
            favorite_prompts.append(prompt)

    if len(favorite_prompts) == 0:
        print("즐겨찾기한 프롬프트가 없습니다.")
        return

    for index, prompt in enumerate(favorite_prompts, start=1):
        print(f"{index}. [{prompt['category']}] {prompt['title']} ⭐")

    print(f"\n총 {len(favorite_prompts)}개의 즐겨찾기")

def main():
    """프로그램의 메뉴를 반복 실행한다."""
    while True:
        show_menu()
        choice = input("선택: ").strip()

        if choice == "0":
            print("프로그램을 종료합니다.")
            break

        elif choice == "1":
            add_prompt()

        elif choice == "2":
            show_prompt_list()

        elif choice == "3":
            show_category()

        elif choice == "4":
            search_prompt()

        elif choice == "5":
            show_prompt_detail()

        elif choice == "6":
            manage_favorite()

        elif choice == "7":
            show_favorites()

        else:
            print("잘못된 번호입니다. 다시 입력해주세요.")


main()

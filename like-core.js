function initLike({ button, postId, supabaseUrl, supabaseKey }) {
	const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
	const storageKey = `blog-liked-${postId}`;
	let liked = localStorage.getItem(storageKey) === "true";

	function render(count) {
		button.textContent = `${liked ? "♥" : "♡"} 点赞 ${count}`;
		button.classList.toggle("is-liked", liked);
		button.setAttribute("aria-pressed", String(liked));
	}

	async function loadCount() {
		const { data, error } = await supabaseClient
			.from("post_likes")
			.select("like_count")
			.eq("post_id", postId)
			.maybeSingle();

		if (error) {
			throw error;
		}
		return data?.like_count || 0;
	}

	async function loadAndRender() {
		try {
			render(await loadCount());
		} catch (error) {
			button.textContent = "点赞暂不可用";
			console.error("读取点赞数失败：", error);
		}
	}

	button.addEventListener("click", async () => {
		button.disabled = true;
		try {
			const currentCount = await loadCount();
			const nextCount = Math.max(0, currentCount + (liked ? -1 : 1));
			const { error } = await supabaseClient
				.from("post_likes")
				.upsert({ post_id: postId, like_count: nextCount });

			if (error) {
				throw error;
			}
			liked = !liked;
			localStorage.setItem(storageKey, String(liked));
			render(nextCount);
		} catch (error) {
			console.error("保存点赞数失败：", error);
		} finally {
			button.disabled = false;
		}
	});

	loadAndRender();
}

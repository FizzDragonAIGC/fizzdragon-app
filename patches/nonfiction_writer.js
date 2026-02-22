// ==================== 非虚构文学智能体（MVP）====================
async function triggerNonfictionWriter() {
  // 需要故事源（人生经验）
  const material = (state.assets?.story?.content || state.novel || state.originalScript || '').toString();
  if (!material || material.trim().length < 50) {
    addAIMessage('🖋️ **非虛構文學**\n\n請先把你的人生素材貼進來或導入檔案（故事源）。', [
      { text: '📄 導入故事/素材', action: () => document.getElementById('fileInput').click() },
      { text: '✍️ 我直接粘貼', action: () => addAIMessage('請在下方輸入框粘貼你的人生素材（可分段、可流水帳）。') }
    ]);
    return;
  }

  addTypingIndicator();
  showAgentStatus('🖋️ 非虛構文學', '正在把素材轉成可寫的長篇藍圖...', 'nonfiction_writer', [
    { text: '📚 讀取人生素材', done: false, current: true },
    { text: '🧭 建立非虛構叙事契約', done: false },
    { text: '🎨 建立文風画像', done: false },
    { text: '🗂️ 生成全书章节规划', done: false },
    { text: '✍️ 生成示范段落', done: false }
  ]);

  try {
    const result = await callAgent('nonfiction_writer', material.substring(0, 15000), {
      targetWords: 150000,
      pov: 'first_person'
    });
    const data = safeJSONParse(result, 'nonfiction_writer');

    // 写入资产（尽量复用现有结构）
    state.assets.nonfiction_contract = data.contract || null;
    state.assets.source_style_profile = data.style_profile || null;
    if (Array.isArray(data.characters)) state.assets.characters = data.characters;
    if (data.book?.chapters) {
      state.assets.chapters = data.book.chapters.map((c, i) => ({
        number: c.number || i + 1,
        title: c.title || `第${i+1}章`,
        duration: 3,
        summary: c.summary || '',
        conflict: c.conflict || '',
        highlight: c.highlight || '',
        hook: c.hook || '',
        emotion: c.emotion || '',
        scenes: c.scenes || '',
        target_words: c.target_words || 4000
      }));
      state.production = state.production || {};
      state.production.episodes = state.assets.chapters.length;
    }

    saveProject(null, true);
    updateAssetsPanel();

    removeTypingIndicator();
    hideAgentStatus();

    addAIMessage(`✅ **非虛構文學藍圖已生成**\n\n- 章節：${state.assets.chapters?.length || 0}\n- 角色：${state.assets.characters?.length || 0}\n\n下一步：你可以先回答訪談問題（更像你），再開始逐章寫作。`, [
      { text: '🎤 查看訪談問題', action: () => {
          const qs = (data.interview_questions || []).slice(0, 10).map((q, i) => `${i+1}. ${q.question}`).join('\n');
          addAIMessage(`🎤 **訪談問題（前10個）**\n\n${qs || '(無)'}\n\n你可以直接在輸入框回答我，我會把答案寫進素材。`);
        }
      },
      { text: '✍️ 開始寫第1章', action: () => runScriptWriting(1) }
    ]);

  } catch (e) {
    removeTypingIndicator();
    hideAgentStatus();
    addAIMessage('❌ 非虛構文學生成失敗：' + e.message);
  }
}

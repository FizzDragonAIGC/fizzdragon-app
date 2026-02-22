// ==================== 分鏡工具箱（重置/续跑，不动剧本）====================
function resetAllStoryboards() {
  const total = state.assets?.chapters?.length || 0;
  if (total <= 0) {
    showToast('沒有章節');
    return;
  }
  if (!confirm(`確定要重置全部分鏡嗎？\n\n- 只會刪除分鏡（storyboards）\n- 不影響劇本（scripts）\n- 共 ${total} 集`)) return;

  state.assets.storyboards = {};
  generatingStoryboards = {};
  saveProject(null, true);
  updateAssetsPanel();
  renderProjectList();
  showToast('🧹 已重置全部分鏡');
}

function resumeStoryboardFromPrompt() {
  const total = state.assets?.chapters?.length || 0;
  if (total <= 0) {
    showToast('沒有章節');
    return;
  }
  const input = prompt(`從第幾集開始重新生成分鏡？\n\n輸入範圍：1-${total}\n（只生成分鏡，不重跑劇本）`, '1');
  const k = parseInt((input || '').trim());
  if (!k || k < 1 || k > total) {
    showToast('輸入無效');
    return;
  }
  runStoryboardBatchFrom(k);
}

async function runStoryboardBatchFrom(startEp) {
  const total = state.assets?.chapters?.length || 0;
  if (total <= 0) return;

  const runCtx = createRunContext();
  addAIMessage(`🎬 **分鏡續跑開始**\n\n從第 ${startEp} 集 → 第 ${total} 集\n（不重跑劇本）`, [
    { text: '⛔ 停止', action: () => { newRunToken(); showToast('已停止'); } }
  ], runCtx);

  for (let i = startEp; i <= total; i++) {
    if (!isRunContextActive(runCtx)) return;
    if (!state.assets?.scripts?.[i]) {
      console.warn('skip storyboard, no script ep', i);
      continue;
    }
    // 覆盖重做：先清掉旧分镜
    if (state.assets.storyboards?.[i]) delete state.assets.storyboards[i];
    saveProject(null, true);
    updateAssetsPanel();
    await runStoryboardGeneration(i);
  }

  if (!isRunContextActive(runCtx)) return;
  addAIMessage('✅ 分鏡續跑完成', [], runCtx);
}

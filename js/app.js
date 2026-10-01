(() => {
  const $=id=>document.getElementById(id);
  let toastTimer=0,isResetting=false;
  const STORE_KEY = 'neon-brew-save-v1';
  const OFFLINE_CAP = 8 * 60 * 60;
  const UI_SETTINGS_KEY = 'neon-brew-ui-v1';
  function loadUiSettings(){try{const settings=JSON.parse(localStorage.getItem(UI_SETTINGS_KEY)||'{}');return {theme:['neon','blood','fog'].includes(settings.theme)?settings.theme:'neon',language:settings.language==='en'?'en':'vi'}}catch{return {theme:'neon',language:'vi'}}}
  const uiSettings=loadUiSettings();
  const idleRate = () => Date.now()<(state.stalledUntil||0)?0:state.bots*(1.25+(state.upgrades.grinder||0)*.22)*(1+(state.prestiges||0)*.05)*(state.robotUnion?1.15:1)*(factionBonus('cyborgs')>=10?1.2:1)*(state.upgrades.robotCore?1.25:1)*(state.upgrades.branchNet?1.2:1)*Math.pow(1.35,Math.max(0,state.branches-1));
  const format = n => Math.floor(n).toLocaleString(uiSettings.language==='en'?'en-US':'vi-VN');
  const {recipes,ingredients,factions,weathers,decorItems,tracks,upgrades,storyEvents}=window.NEON_BREW_CATALOG;
  const eventRules=window.NEON_BREW_EVENT_RULES;
  const ingredientPalette = {
    meteor:['espresso','plasma'],
    matcha:['plasma','boba'],
    mocha:['espresso','plasma','boba'],
    ramen:['espresso','plasma','boba'],
    overclock:['espresso','plasma','boba','syrup'],
    bionic:['espresso','plasma','boba','syrup']
  };
  function recipeIngredientIds(recipeId){
    const recipe = recipeById(recipeId);
    if (recipe && ingredientPalette[recipe.id]) return ingredientPalette[recipe.id];
    const fallback = [...new Set((recipe?.tags || []).map(tag => ({
      caffeine:'espresso',
      bold:'plasma',
      energy:'boba',
      premium:'syrup'
    }[tag])).filter(Boolean))];
    return fallback.length ? fallback : ['espresso'];
  }
  const initialState = () => ({money:120,reputation:0,served:0,xp:0,level:1,bots:0,branches:1,upgrades:{machine:0,sign:0,grinder:0},inventory:Object.fromEntries(ingredients.map(item=>[item.id,item.start])),cyberWaste:0,unlockedRecipes:[],researchTrials:0,researchSuccesses:0,researchFailures:0,tutorialStep:0,tutorialDone:false,factionRep:{hackers:0,samurai:0,corporate:0,cyborgs:0},orderFaction:'hackers',orderId:'meteor',orderNumber:1,orderStarted:Date.now(),orderExpires:Date.now()+45000,orderVip:false,orderShuffleAt:Date.now()+30000,weatherId:'neon',weatherChangedAt:Date.now()+90000,decorations:{},drone:0,bouncer:0,firewall:0,deliveryDrone:0,deliveryActive:false,robotUnion:false,maintenanceDueAt:Date.now()+3600000,matrixCyclesLeft:0,matrixCycleEnds:0,matrixNextAt:Date.now()+180000,yakuzaProtectionUntil:0,bulkOrder:null,arenaBuffUntil:0,stalledUntil:0,securityNextAt:Date.now()+25000,securityEvictions:0,ransomwareIncidents:0,tracks:['afterglow'],trackId:'afterglow',audio:false,crt:false,daily:{date:new Date().toISOString().slice(0,10),espresso:0,hackers:0,seconds:0,rewarded:false},chips:0,prestiges:0,badges:{millionaire:false,recipes:false,rebirth:false},lastSeen:Date.now(),log:[],badOrders:0,reviewScore:100,starRating:5,inspectionProgress:0,inspectionActive:false,gameOver:false,paranoia:0,ghostOrder:null,loreFragments:[],lastHorrorAt:Date.now(),hallucinationUntil:0,robotWhisper:'',horrorPhase:0});
  function loadState(){
    try{
      const parsed=JSON.parse(localStorage.getItem(STORE_KEY));
      if(!parsed||typeof parsed!=='object')return initialState();
      const base=initialState();
      const state={...base,...parsed,upgrades:{...Object.fromEntries(upgrades.map(item=>[item.id,0])),...parsed.upgrades},inventory:{...base.inventory,...parsed.inventory},factionRep:{...base.factionRep,...parsed.factionRep},decorations:{...base.decorations,...parsed.decorations},daily:{...base.daily,...parsed.daily},badges:{...base.badges,...parsed.badges},tracks:Array.isArray(parsed.tracks)?parsed.tracks:['afterglow'],unlockedRecipes:Array.isArray(parsed.unlockedRecipes)?parsed.unlockedRecipes:[],log:Array.isArray(parsed.log)?parsed.log.slice(0,5):[]};
      for(const key of ['money','reputation','served','xp','level','bots','branches','orderNumber','chips','prestiges','cyberWaste','researchTrials','researchSuccesses','researchFailures','tutorialStep','drone','bouncer','firewall','deliveryDrone','matrixCyclesLeft','matrixCycleEnds','matrixNextAt','securityEvictions','ransomwareIncidents','yakuzaProtectionUntil','arenaBuffUntil','stalledUntil','maintenanceDueAt','weatherChangedAt','orderStarted','orderExpires','orderShuffleAt','lastSeen','reviewScore'])if(!Number.isFinite(state[key]))state[key]=base[key];
      for(const key of ['money','reputation','served','xp','bots','chips','prestiges','cyberWaste','researchTrials','researchSuccesses','researchFailures','drone','bouncer','firewall','deliveryDrone','securityEvictions','ransomwareIncidents'])state[key]=Math.max(0,Math.floor(state[key]));
      state.level=Math.max(1,Math.floor(state.level));state.orderNumber=Math.max(1,Math.floor(state.orderNumber));state.branches=Math.max(1,Math.min(100,Math.floor(state.branches)));
      state.matrixCyclesLeft=Math.max(0,Math.min(eventRules.matrixCycles,Math.floor(state.matrixCyclesLeft)));state.deliveryActive=!!state.deliveryActive;state.robotUnion=!!state.robotUnion;
      state.researchTrials=Math.max(state.researchTrials,state.researchSuccesses+state.researchFailures);state.tutorialStep=Math.max(0,Math.min(6,state.tutorialStep));state.tutorialDone=!!state.tutorialDone;
      state.daily={...base.daily,...state.daily};for(const key of ['espresso','hackers','seconds'])state.daily[key]=Math.max(0,Number(state.daily[key])||0);state.daily.rewarded=!!state.daily.rewarded;
      for(const key of Object.keys(base.inventory))state.inventory[key]=Math.max(0,Math.floor(Number(state.inventory[key])||0));
      for(const key of Object.keys(base.factionRep))state.factionRep[key]=Math.max(0,Number(state.factionRep[key])||0);
      for(const item of upgrades)state.upgrades[item.id]=Math.max(0,Number(state.upgrades[item.id])||0);
      return state;
    }catch{return initialState()}
  }
  let state=loadState();
  if(state.securityScheduleVersion!==1){state.securityNextAt=Date.now()+securityDelay();state.securityScheduleVersion=1}
  if(!Number.isFinite(state.securityNextAt))state.securityNextAt=Date.now()+securityDelay();
  for(const item of upgrades)state.upgrades[item.id]=Math.max(0,Number(state.upgrades[item.id])||0);
  state.audio=false;
  const now=Date.now();
  const awaySeconds=Math.min(OFFLINE_CAP,Math.max(0,(now-(Number(state.lastSeen)||now))/1000));
  const previousRate=idleRate(),lastSeen=Number(state.lastSeen)||now,matrixRemaining=state.matrixCyclesLeft>0?Math.max(0,state.matrixCycleEnds-lastSeen)+Math.max(0,state.matrixCyclesLeft-1)*eventRules.matrixDuration:0,matrixOffline=Math.min(awaySeconds,matrixRemaining/1000),deliveryOffline=state.weatherId==='acid'?Math.min(awaySeconds,Math.max(0,(state.weatherChangedAt-lastSeen)/1000)):0;
  const offlineGain=Math.floor(awaySeconds*previousRate+matrixOffline*previousRate*2+deliveryOffline*deliveryRate());
  const maintenancePeriods=state.robotUnion&&now>=state.maintenanceDueAt?Math.floor((now-state.maintenanceDueAt)/3600000)+1:0,offlineMaintenance=maintenancePeriods*Math.ceil(state.bots*.5);
  if(maintenancePeriods)state.maintenanceDueAt+=maintenancePeriods*3600000;
  while(state.matrixCyclesLeft>0&&state.matrixCycleEnds<=now){state.matrixCyclesLeft--;if(state.matrixCyclesLeft>0)state.matrixCycleEnds+=eventRules.matrixDuration;else{state.matrixCycleEnds=0;state.matrixNextAt=Math.max(state.matrixNextAt,now+180000)}}
  if(offlineGain>0||offlineMaintenance>0){state.money=Math.max(0,state.money+offlineGain-offlineMaintenance);addLog(`Robot kiếm ¢${format(offlineGain)} và tốn ¢${format(offlineMaintenance)} bảo trì khi bạn vắng mặt.`,'OFFLINE');if(offlineGain>0)window.setTimeout(()=>toast(`Trong lúc bạn vắng mặt, robot đã kiếm ¢${format(offlineGain)}.`),500)}
  if(!state.orderId||!allRecipes().some(recipe=>recipe.id===state.orderId)||!Number.isFinite(state.orderExpires)||state.orderExpires<now){if(Number.isFinite(state.orderExpires)&&state.orderExpires<now){state.badOrders++;state.reputation=Math.max(0,state.reputation-1);state.reviewScore=Math.max(0,state.reviewScore-20);state.starRating=Math.max(0,state.starRating-1);if(state.starRating<1){state.inspectionActive=true;state.inspectionProgress=Math.max(state.inspectionProgress,15000);if(!state.gameOver){triggerGameOver('Dưới 1 sao. Kiểm tra thực phẩm và quán bị đóng cửa.');}}}newOrder(false)}
  function saveUiSettings(){localStorage.setItem(UI_SETTINGS_KEY,JSON.stringify(uiSettings))}
  function applyUiSettings(){document.body.dataset.theme=uiSettings.theme;$('themeSelect').value=uiSettings.theme;$('languageSelect').value=uiSettings.language;$('quickLanguageSelect').value=uiSettings.language;$('introLanguageSelect').value=uiSettings.language;$('creatorCopyVi').hidden=uiSettings.language==='en';$('creatorCopyEn').hidden=uiSettings.language!=='en';window.NEON_BREW_I18N.apply(uiSettings.language)}
  let activeBrew=false, brewTimer=0, savingTimer=0, timerNotice='', audioContext=null,audioLoop=null,audioStep=0,activeThreat=null,activeStoryEvent=null,sessionStarted=false,tutorialActive=false,guidedOutside=false,tickTimer=null;
  $('confirmReset').addEventListener('click',()=>{isResetting=true});
  function orderBonus(){return Math.round(12+state.upgrades.machine*4+state.upgrades.sign*2)}
  function allRecipes(){return [...recipes,...state.unlockedRecipes]}
  function recipeById(id){return allRecipes().find(recipe=>recipe.id===id)||recipes[0]}
  function customerLikes(recipe,factionId=state.orderFaction){const faction=factions.find(item=>item.id===factionId);if(!faction)return false;if(factionId==='corporate')return recipe.price>=28||recipe.legendary;if(faction.want==='premium')return recipe.price>=28||recipe.legendary;return (recipe.tags||[]).includes(faction.want)}
  function factionBonus(id=state.orderFaction){return Number(state.factionRep[id])||0}
  function shopMultiplier(){return (1+state.upgrades.machine*.15+state.upgrades.sign*.1+state.prestiges*.05)*(state.upgrades.premiumBeans?1.1:1)}
  function researchChance(){return Math.min(.9,.65+(factionBonus('hackers')>=25?.15:0)+(state.upgrades.labScanner?.1:0))}
  function orderReward(){const recipe=recipeById(state.orderId),liked=customerLikes(recipe);let value=recipe.legendary?recipe.price*5:recipe.price;if(state.weatherId==='acid'&&(recipe.tags||[]).includes('hot'))value*=1.5;if(state.orderVip)value*=1.5;if(state.orderFaction==='corporate')value*=1.5;if(state.orderFaction==='corporate'&&factionBonus('corporate')>=10)value*=1.15;if(state.decorations.pixelFloor)value*=1.2;if(liked&&state.orderFaction==='samurai')value*=1.2;if(liked&&state.orderFaction==='cyborgs'&&factionBonus('cyborgs')>=25)value*=1.2;if(state.arenaBuffUntil>Date.now()&&state.orderFaction==='cyborgs')value*=2;if(state.upgrades.tipJar)value*=1.1;return Math.round((value*shopMultiplier()+orderBonus())*moneyMultiplier())}
  function upgradeCost(item){return Math.ceil(item.base*Math.pow(1.68,state.upgrades[item.id]))}
  function botCost(){return Math.ceil(90*Math.pow(1.82,state.bots))}
  function branchCost(){return Math.ceil(650*Math.pow(2.25,state.branches-1))}
  function firewallCost(){return Math.ceil(350*Math.pow(1.8,state.firewall))}
  function deliveryDroneCost(){return Math.ceil(320*Math.pow(1.8,state.deliveryDrone))}
  function deliveryRate(){return state.weatherId==='acid'&&state.deliveryActive?state.deliveryDrone*27*(state.upgrades.deliveryFleet?1.2:1):0}
  function securityDelay(){return 120000+(state.upgrades.securityGrid?30000:0)}
  function moneyMultiplier(){return state.matrixCyclesLeft>0?3:1}
  function addLog(message,label='Pha chế'){state.log.unshift({message,label,time:clockText()});state.log=state.log.slice(0,5)}
  function addLoreFragment(fragment){
    if(!fragment)return;
    state.loreFragments = [...new Set([...(state.loreFragments||[]), fragment])].slice(-5);
    addLog(fragment,'Bí mật quán');
  }
  function applyParanoia(delta){
    state.paranoia = Math.max(0, Math.min(100, Number(state.paranoia || 0) + delta));
    if(state.paranoia >= 100 && !state.gameOver){
      state.gameOver = true;
      state.inspectionActive = false;
      $('gameOverTitle').textContent = 'CỬA QUÁN ĐÃ MỞ';
      $('gameOverText').textContent = 'Đêm đã quá sâu. Những cái tên không tên đã ở quá gần. Quán bị khóa lại bởi thứ không bao giờ dậy sớm.';
      $('gameOverDialog').hidden = false;
      $('gameOverDialog').classList.add('show');
      toast('Ám ảnh đã tràn ngập quán.');
      save();
    }
  }
  function triggerMysteriousCustomer(){
    const names=['Khách áo trùm đầu','Bóng người ở kính cửa','Cái tên đã bị xóa','Người ở cuối quầy'];
    const requests=['"Sương Đêm Không Tên"','"Nước Ảo Ảnh"','"Cốc Chưa Từng Có"','"Món Vô Danh"'];
    state.ghostOrder={
      name:names[Math.floor(Math.random()*names.length)],
      request:requests[Math.floor(Math.random()*requests.length)],
      expires:Date.now()+22000,
      reward:35
    };
    state.lastHorrorAt=Date.now();
    state.horrorPhase=1;
    applyParanoia(8);
    addLoreFragment('Bạn thấy vết bẩn trên gương: ai đó đã viết lại tên của quán bằng mực cũ.');
    toast('Một bóng người lạ xuất hiện ở cửa kính.');
    addLog('Khách áo trùm đầu xuất hiện lúc nửa đêm, gọi một món không có trong menu.','Khách bí ẩn');
    triggerHallucination();
  }
  function triggerHallucination(){
    state.hallucinationUntil = Date.now() + 22000;
    state.lastHorrorAt = Date.now();
    applyParanoia(14 + Math.min(12, Math.max(0, state.served - 5) * 2));
    addLoreFragment('Một chiếc đồng hồ trên tường đang chạy ngược. Dưới quầy, có dấu vết đã bị phớt lờ suốt thời gian dài.');
    toast('Ánh đèn chớp, bóng người đi qua cửa kính.');
    addLog('Đèn tắt trong nháy mắt. Bóng người thoáng qua cửa kính rồi biến mất.','Ảo giác');
  }
  function triggerRobotWhisper(){
    const whispers=['"Tôi biết tên bạn..."','"Đừng để hắn đứng ở sau quầy."','"Có người đang gọi món trong cái tủ lạnh."','"Mẹ quán đã từng ở đây."'];
    const whisper = whispers[Math.floor(Math.random()*whispers.length)];
    state.robotWhisper = whisper;
    state.lastHorrorAt = Date.now();
    applyParanoia(6);
    addLoreFragment('Robot phục vụ lặp lại một câu không ai từng dạy nó. Nó biết một cái tên mà chưa ai từng nói trước đó.');
    toast('Robot nói vọng lên một câu kỳ lạ.');
    addLog(`Robot nói: “${whisper}”`,'Robot lỗi');
  }
  function starTrustLevel(){const customers=Math.max(1,state.served);const tolerance=Math.max(1,Math.ceil(customers/8));return Math.max(0,5-Math.floor(state.badOrders/tolerance))}
  function updateStarRating(){
    const score = Math.max(0, Math.min(100, Number(state.reviewScore) || 100));
    state.starRating = Math.max(0, Math.min(5, Math.floor(score / 20)));
    if(state.starRating < 1){
      if(!state.inspectionActive){state.inspectionActive=true;toast('Dưới 1 sao — kiểm tra thực phẩm đang tới!');addLog('Danh tiếng thấp dưới 1 sao. Quán chuẩn bị bị kiểm tra.','Kiểm tra');}
      state.inspectionProgress=Math.max(state.inspectionProgress,15000);
      if(!state.gameOver){triggerGameOver('Dưới 1 sao. Kiểm tra thực phẩm và quán bị đóng cửa.');}
    }else{state.inspectionActive=false;state.inspectionProgress=0}
  }
  function triggerGameOver(reason='Kiểm tra thực phẩm thất bại. Quán bị đóng cửa.'){if(state.gameOver)return;state.gameOver=true;state.inspectionActive=false;$('gameOverTitle').textContent='GAME OVER';$('gameOverText').textContent=reason;$('gameOverDialog').hidden=false;$('gameOverDialog').classList.add('show');toast('GAME OVER — kiểm tra thực phẩm thất bại!');save()}
  function startMatrixLoop(){state.matrixCyclesLeft=eventRules.matrixCycles;state.matrixCycleEnds=Date.now()+eventRules.matrixDuration;state.matrixNextAt=Date.now()+180000;document.body.classList.add('matrix-glitch');addLog('Thời gian lặp lại 10 giây · thu nhập nhân 3 trong ba vòng.','Matrix');renderLive();save();toast('Glitch in the Matrix · x3 Credits trong 30 giây!')}
  function showIncident(kind,title,copy,note,timeout,buttons,prompt=''){
    activeThreat={kind,expires:Date.now()+timeout,pay:eventRules.ransom(state.money)};activeStoryEvent=kind.startsWith('story:')?kind.slice(6):null;const box=$('threatDialog'),panel=box.querySelector('.threat-box');$('threatTitle').textContent=title;$('threatCopy').textContent=copy;$('threatNote').textContent=note||'';$('threatNote').hidden=!note;$('threatPrompt').hidden=!prompt;$('threatPrompt').textContent=prompt;$('threatAnswer').hidden=!prompt;$('threatAnswer').value='';panel.classList.toggle('event-story',!prompt);for(const id of ['payThreat','reinstallThreat','hackThreat','acceptUnion','formatRobots','solveThreat','acceptStory','declineStory'])$(id).hidden=!buttons.includes(id);$('threatTimer').textContent=String(Math.ceil(timeout/1000));$('threatDialog').hidden=false;const first=buttons.map(id=>$(id)).find(button=>button&&!button.disabled);if(first)first.focus()
  }
  function closeIncident(){activeThreat=null;activeStoryEvent=null;$('threatDialog').hidden=true;$('threatDialog').querySelector('.threat-box').classList.remove('event-story')}
  function finishIncident(message,label='An ninh'){closeIncident();if(message)$('securityStatus').textContent=message;addLog(message||'Sự cố đã kết thúc.',''+label);render();save()}
  function showStoryEvent(id){if(activeThreat)return;const event=storyEvents[id];if(!event)return;const choices=id==='yakuza'?['acceptStory','declineStory']:['acceptStory','declineStory'];showIncident(`story:${id}`,event.title,event.copy,id==='bulk'?'Hoàn thành 5 món trong 60 giây để nhận ¢500.':id==='arena'?'Buff Cyborg kéo dài 2 phút, đơn Bionic được ưu tiên.':id==='yakuza'?'Yakuza sẽ bảo kê tiệm trong 3 phút.':'',25000,choices)}
  function resolveStoryEvent(accept){const id=activeStoryEvent;if(!id)return;if(accept&&id==='yakuza'){state.yakuzaProtectionUntil=Date.now()+180000;addLog('Yakuza nhận bảo kê khu phố trong 3 phút.','Yakuza');toast('Băng đảng đối thủ sẽ bị Yakuza chặn lại.')}else if(accept&&id==='bulk'){state.bulkOrder={remaining:5,total:5,expires:Date.now()+60000};addLog('Nhận đơn Corporate: phục vụ 5 món trong 60 giây.','Đơn lớn');toast('Đơn hàng lớn đang chạy!')}else if(accept&&id==='arena'){state.arenaBuffUntil=Date.now()+120000;state.orderId='bionic';state.orderFaction='cyborgs';state.orderVip=true;state.orderStarted=Date.now();state.orderExpires=Date.now()+30000;addLog('Đấu sĩ Cyborg gọi Bít Tết Bionic.','Đấu trường');toast('Đơn Cyborg VIP đang chờ!')}else addLog(`Bỏ qua lời mời ${storyEvents[id].title}.`,'Sự kiện');closeIncident();render();save()}
  function advanceBulkOrder(){if(!state.bulkOrder)return;state.bulkOrder.remaining--;if(state.bulkOrder.remaining<=0){const reward=500*moneyMultiplier();state.money+=reward;state.reputation+=5;state.bulkOrder=null;addLog(`Hoàn tất đơn Corporate số lượng lớn · +¢${format(reward)}.`,'Đơn lớn');toast(`Đơn hoàn tất! +¢${format(reward)}.`)}}
  function clockText(){const date=new Date();return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`}
  function dayKey(){return new Date().toISOString().slice(0,10)}
  function save(){if(isResetting)return;state.lastSeen=Date.now();try{localStorage.setItem(STORE_KEY,JSON.stringify(state));$('saveStatus').textContent='ĐÃ LƯU · '+clockText()}catch{$('saveStatus').textContent='KHÔNG THỂ LƯU TRÊN THIẾT BỊ'}}
  function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2500)}
  function newOrder(log=true, forceDifferent=false){
    const pool=allRecipes();
    const arenaActive=state.arenaBuffUntil>Date.now();
    let nextRecipeId=arenaActive&&Math.random()<.6?'bionic':pool[Math.floor(Math.random()*pool.length)].id;
    if(forceDifferent || state.orderId){
      const alternatives=pool.filter(recipe=>recipe.id!==state.orderId && (!forceDifferent || recipe.id!==nextRecipeId));
      if(alternatives.length)nextRecipeId=alternatives[Math.floor(Math.random()*alternatives.length)].id;
    }
    state.orderId=nextRecipeId;
    const factionPool=factions.map(item=>item.id);if(arenaActive)state.orderFaction='cyborgs';else if(state.weatherId==='neon'&&Math.random()<.35)state.orderFaction='cyborgs';else if(state.weatherId==='fog'&&Math.random()<.4)state.orderFaction='corporate';else state.orderFaction=factionPool[Math.floor(Math.random()*factionPool.length)];const vipChance=(state.decorations.neonSign?.15:0)+(state.upgrades.vipBeacon?.1:0)+.04;state.orderVip=arenaActive||Math.random()<vipChance;const now=Date.now(),baseWait=state.orderFaction==='corporate'?(factionBonus('corporate')>=25?32000:22000):45000,wait=baseWait*(state.weatherId==='acid'?2:1);state.orderStarted=now;state.orderExpires=now+wait+(state.decorations.pixelFloor?10000:0);state.orderShuffleAt=now+15000+Math.random()*20000;state.orderNumber++;if(log)addLog('Có khách mới ghé quầy.','Khách mới')
  }
  function renderRecipes(){const grid=$('recipeGrid');grid.innerHTML='';for(const recipe of allRecipes()){const button=document.createElement('button');button.className='recipe-btn'+(recipe.id===state.orderId?' match':'');button.type='button';button.disabled=activeBrew||Date.now()<state.orderStarted;button.setAttribute('aria-label',`Pha ${recipe.name}, giá cơ bản ${recipe.price} đồng`);button.innerHTML=`<div class="recipe-top"><span class="recipe-emoji">${escapeHtml(recipe.icon)}</span><span class="recipe-price">${recipe.legendary?'×5 ':''}¢${format(recipe.price)}</span></div><div class="recipe-name">${escapeHtml(recipe.name)}</div><div class="recipe-note">${escapeHtml(recipe.details)}</div>`;button.addEventListener('click',()=>brew(recipe.id));grid.appendChild(button)}}
  function renderUpgrades(){const list=$('upgradeList');list.innerHTML='';for(const item of upgrades){const level=state.upgrades[item.id],cost=upgradeCost(item),owned=!!item.oneTime&&level>0,row=document.createElement('div');row.className='upgrade';row.innerHTML=`<div class="upgrade-icon">${item.icon}</div><div class="upgrade-copy"><div class="upgrade-title">${item.name}</div><div class="upgrade-desc">${item.description}</div><div class="upgrade-level">${owned?'ĐÃ SỞ HỮU':`CẤP ${String(level).padStart(2,'0')}`}</div></div>`;const button=document.createElement('button');button.type='button';button.className='buy-btn';button.dataset.cost=cost;button.dataset.owned=String(owned);button.disabled=owned||state.money<cost;button.setAttribute('aria-label',`Nâng cấp ${item.name}, giá ${cost} đồng`);button.innerHTML=owned?'ĐÃ MUA':`¢ ${format(cost)}`;button.addEventListener('click',()=>buyUpgrade(item));row.appendChild(button);list.appendChild(row)}}
  function dailyProgress(){return {espresso:Math.min(200,state.daily.espresso),hackers:Math.min(3,state.daily.hackers),seconds:Math.min(900,Math.floor(state.daily.seconds))}}
  function checkBadges(){const goals=[['millionaire',state.money>=1000000],['recipes',state.unlockedRecipes.length>=3],['rebirth',state.prestiges>0]];for(const [id,earned] of goals){if(earned&&!state.badges[id]){state.badges[id]=true;state.chips++;addLog(`Mở khóa huy hiệu ${id==='millionaire'?'Triệu phú Cyber':id==='recipes'?'Bậc thầy công thức':'Chuyển sinh lần đầu'} · +1 Quantum Chip.`,'Thành tựu')}}}
  function renderFeatureViews(){
    $('chipValue').textContent=`◇ ${format(state.chips)} QC`;$('chipBalance').textContent=`◇ ${format(state.chips)} QC`;$('prestigeCount').textContent=`${state.prestiges} LẦN TÁI SINH`;
    const requested=recipeById(state.orderId),faction=factions.find(item=>item.id===state.orderFaction)||factions[0];$('factionGuestIcon').textContent=faction.icon;$('factionGuestType').textContent=state.orderVip?'KHÁCH VIP · '+faction.name.toUpperCase():faction.name.toUpperCase();$('factionGuestName').textContent=state.orderVip?'Khách VIP · '+requested.name:requested.name;$('factionGuestMood').textContent=`${customerLikes(requested)?'HỢP GU':'ĐANG CHỜ'} · ${faction.want==='premium'?'hạng sang':faction.want}`;
    $('factionList').innerHTML=factions.map(item=>{const score=Math.max(0,state.factionRep[item.id]||0),level=score>=25?'ĐẶC QUYỀN II':score>=10?'ĐẶC QUYỀN I':'ĐANG GÂY DỰNG';return `<div class="faction-row"><span class="faction-icon">${item.icon}</span><div><div class="faction-name">${item.name}</div><div class="faction-perk">${item.perk}</div><div class="faction-meter"><i style="width:${Math.min(100,score/25*100)}%"></i></div></div><span class="faction-score">${format(score)}<br>${level}</span></div>`}).join('');
    const weather=weathers.find(item=>item.id===state.weatherId)||weathers[2];$('weatherIcon').textContent=weather.icon;$('weatherName').textContent=weather.name;$('weatherEffect').textContent=state.ghostOrder?`Bí ẩn quanh quán · ${state.ghostOrder.request}`:state.paranoia>60?`Ám ảnh tứ phía · sợ hãi ${state.paranoia}%`:weather.effect;$('weatherClock').textContent=`ĐỔI SAU ${Math.max(0,Math.ceil((state.weatherChangedAt-Date.now())/1000))}S`;
    $('ingredientStock').innerHTML=ingredients.map(item=>`<div class="stock-item"><div class="stock-top"><span class="stock-name">${item.icon} ${item.name}</span><span class="stock-amount">×${format(state.inventory[item.id]||0)}</span></div><div class="stock-cost">¢${item.cost} / đơn vị</div><button class="action-btn" data-cost="${item.cost}" data-buy-ingredient="${item.id}" ${state.money<item.cost?'disabled':''}>MUA 1 · ¢${item.cost}</button></div>`).join('')+(state.cyberWaste?`<div class="stock-item"><div class="stock-top"><span class="stock-name">☣ Rác thải Cyber</span><span class="stock-amount">×${format(state.cyberWaste)}</span></div><div class="stock-cost">Phế liệu có thể tái chế.</div><button class="action-btn" data-recycle-waste>TÁI CHẾ · +¢${format(state.cyberWaste*5)}</button></div>`:'');
    const selects=[$('ingredientA'),$('ingredientB'),$('ingredientC')],chosen=selects.map(select=>select.value);for(let index=0;index<selects.length;index++){selects[index].innerHTML=ingredients.map(item=>`<option value="${item.id}">${item.name} · ×${state.inventory[item.id]||0}</option>`).join('');if(chosen[index])selects[index].value=chosen[index]}
    const selected=selects.map(select=>select.value),needed=Object.fromEntries(ingredients.map(item=>[item.id,selected.filter(id=>id===item.id).length]));const canMix=Object.entries(needed).every(([id,count])=>(state.inventory[id]||0)>=count)&&state.money>=18,researchProgress=state.researchTrials%5;$('researchButton').disabled=!canMix;$('researchOdds').textContent=`${Math.round(researchChance()*100)}% THÀNH CÔNG`;$('researchSuccessCount').textContent=String(state.researchSuccesses);$('researchFailureCount').textContent=String(state.researchFailures);$('researchTrialCount').textContent=String(state.researchTrials);$('researchProgressMeter').style.width=`${researchProgress/5*100}%`;$('researchProgressText').textContent=`Còn ${5-researchProgress} lần thử tới mốc tổng kết tiếp theo. Huyền thoại: 8% trong lần thành công.`;
    $('formulaCount').textContent=`${recipes.length+state.unlockedRecipes.length} CÔNG THỨC`;$('formulaList').innerHTML=[...recipes,...state.unlockedRecipes].map(recipe=>`<div class="formula-entry"><span>${escapeHtml(recipe.icon)} ${escapeHtml(recipe.name)}<small>${escapeHtml(recipe.details)}</small></span><span class="tag-chip">${recipe.legendary?'HUYỀN THOẠI ×5':'¢'+format(recipe.price)}</span></div>`).join('');
    $('decorGrid').innerHTML=decorItems.map(item=>`<div class="decor-item"><div class="decor-top"><span class="decor-name">${item.icon} ${item.name}</span><span class="tag-chip">${state.decorations[item.id]?'ĐÃ LẮP':'¢'+format(item.cost)}</span></div><div class="decor-desc">${item.description}</div><button class="action-btn" data-cost="${item.cost}" data-owned="${!!state.decorations[item.id]}" data-buy-decor="${item.id}" ${state.decorations[item.id]||state.money<item.cost?'disabled':''}>${state.decorations[item.id]?'ĐANG HOẠT ĐỘNG':'MUA · ¢'+format(item.cost)}</button></div>`).join('');
    $('buyDrone').textContent=state.drone?`DRONE CẤP ${state.drone} · ¢${format(Math.ceil(220*Math.pow(1.7,state.drone)))}`:'MUA DRONE · ¢220';$('buyDrone').dataset.cost=Math.ceil(220*Math.pow(1.7,state.drone));$('buyDrone').disabled=state.money<Number($('buyDrone').dataset.cost);$('buyBouncer').textContent=state.bouncer?`BOUNCER CẤP ${state.bouncer} · ¢${format(Math.ceil(280*Math.pow(1.7,state.bouncer)))}`:'THUÊ BOUNCER · ¢280';$('buyBouncer').dataset.cost=Math.ceil(280*Math.pow(1.7,state.bouncer));$('buyBouncer').disabled=state.money<Number($('buyBouncer').dataset.cost);$('buyFirewall').textContent=state.firewall?`FIREWALL CẤP ${state.firewall} · ¢${format(firewallCost())}`:`MUA FIREWALL · ¢${format(firewallCost())}`;$('buyFirewall').dataset.cost=firewallCost();$('buyFirewall').disabled=state.money<firewallCost();$('securityLevel').textContent=`Drone ${state.drone} · Bouncer ${state.bouncer} · Firewall ${state.firewall} · Đã chặn ${state.securityEvictions} cuộc ghé thăm.`;
    $('buyDeliveryDrone').textContent=state.deliveryDrone?`NÂNG DRONE ${state.deliveryDrone} · ¢${format(deliveryDroneCost())}`:`MUA DRONE · ¢${format(deliveryDroneCost())}`;$('buyDeliveryDrone').dataset.cost=deliveryDroneCost();$('buyDeliveryDrone').disabled=state.money<deliveryDroneCost();$('toggleDelivery').disabled=state.deliveryDrone<1;$('toggleDelivery').textContent=state.deliveryActive?'TẮT ĐỘI BAY':'KÍCH HOẠT ĐỘI BAY';$('deliveryRate').textContent=`+¢${format(deliveryRate())} / GIÂY`;$('deliveryStatus').textContent=state.deliveryDrone?state.weatherId==='acid'?(state.deliveryActive?'Bão axit: đội bay hoạt động, thu nhập +200%.':'Bão axit: bật đội bay để tăng thu nhập 200%.'):`Đội bay sẵn sàng · chỉ tạo doanh thu khi có Bão Mưa Axit.`:'Mua drone để mở đội giao hàng tận nơi.';
    const track=tracks.find(item=>item.id===state.trackId)||tracks[0];$('jukeboxTrackName').textContent=track.name;$('jukeboxTrackDesc').textContent=`${track.style} · NEO-SAIGON`;$('waveBars').classList.toggle('playing',state.audio);$('trackList').innerHTML=tracks.map(item=>{const owned=state.tracks.includes(item.id),playing=state.trackId===item.id;return `<div class="track-item"><div class="track-top"><span class="track-name">♫ ${item.name}</span><span class="tag-chip">${playing?'ĐANG CHỌN':owned?'ĐÃ MUA':'¢'+format(item.cost)}</span></div><div class="track-desc">${item.style}</div><button class="action-btn" ${owned?'':`data-cost="${item.cost}"`} data-track="${item.id}" ${!owned&&state.money<item.cost?'disabled':''}>${!owned?'MUA ĐĨA · ¢'+format(item.cost):playing&&state.audio?'ĐANG PHÁT':'PHÁT ĐĨA'}</button></div>`}).join('');
    const progress=dailyProgress(),allDone=progress.espresso>=200&&progress.hackers>=3&&progress.seconds>=900;$('dailyDate').textContent=dayKey();$('questList').innerHTML=[{id:'espresso',title:'Thợ chiết xuất',label:'Pha 200 ly cà phê',value:progress.espresso,target:200},{id:'hackers',title:'Tường lửa sống',label:'Đuổi 3 Hacker',value:progress.hackers,target:3},{id:'seconds',title:'Ca đêm bền bỉ',label:'Chơi 15 phút',value:progress.seconds,target:900}].map(item=>`<div class="quest-item" data-quest="${item.id}"><div class="quest-title">${item.title}</div><div class="quest-meta"><span>${item.label}</span><span>${format(item.value)} / ${format(item.target)}</span></div><div class="quest-meter"><i style="width:${Math.min(100,item.value/item.target*100)}%"></i></div></div>`).join('')+(allDone&&!state.daily.rewarded?'<button class="action-btn primary" data-action="claim-quest">NHẬN THƯỞNG · 1 QUANTUM CHIP</button>':'');
    const badgeData=[{id:'millionaire',title:'Triệu phú Cyber',desc:'Tích lũy ¢1.000.000.',earned:state.badges.millionaire||state.money>=1000000},{id:'recipes',title:'Bậc thầy công thức',desc:'Khám phá 3 công thức trong phòng lab.',earned:state.badges.recipes||state.unlockedRecipes.length>=3},{id:'rebirth',title:'Chuyển sinh lần đầu',desc:'Tái khởi động tiệm lần đầu.',earned:state.badges.rebirth||state.prestiges>0}];$('badgeCount').textContent=`${badgeData.filter(item=>item.earned).length} / ${badgeData.length}`;$('badgeGrid').innerHTML=badgeData.map(item=>`<div class="badge-item ${item.earned?'':'locked'}"><span class="badge-mark">${item.earned?'✦':'◇'}</span><div class="badge-title">${item.title}</div><div class="badge-desc">${item.desc}</div></div>`).join('');
    const canPrestige=state.served>=200&&state.chips>=1;$('prestigeButton').disabled=!canPrestige;$('prestigeInfo').textContent=canPrestige?'Đủ điều kiện! Dùng 1 QC để chuyển sinh, giữ huy hiệu và tăng doanh thu vĩnh viễn 5%.':'Cần 200 ly đã phục vụ và 1 Quantum Chip. Nhiệm vụ ngày và thành tựu có thể thưởng QC.';
    const upgradeCount=upgrades.filter(item=>state.upgrades[item.id]>0).length;$('upgradeCount').textContent=`${upgradeCount} / ${upgrades.length}`;$('upgradeMeter').style.width=`${upgradeCount/upgrades.length*100}%`;
    $('crtToggle').setAttribute('aria-pressed',String(!!state.crt));$('crtToggle').textContent=`CRT: ${state.crt?'BẬT':'TẮT'}`;document.body.classList.toggle('crt',!!state.crt);
  }
  function render(){
    $('moneyValue').textContent='¢ '+format(state.money);$('servedValue').textContent=format(state.served);const stars=Array.from({length:5},(_,index)=>`<span class="star ${index<state.starRating?'filled':''}">${index<state.starRating?'★':'☆'}</span>`).join('');$('repValue').innerHTML=`${format(state.reputation)} <small>điểm danh tiếng</small><div class="star-row">${stars}</div>`;$('repTrend').textContent=state.paranoia>65?'ÁM ẢNH':state.paranoia>30?'BẤT AN':'ĐANG LÊN';$('idleValue').innerHTML=`¢${idleRate().toFixed(idleRate()%1?1:0)} <small>/ giây</small>`;$('incomeRate').textContent=`+¢${idleRate().toFixed(idleRate()%1?1:0)}/s`;
    $('botCount').textContent=`${state.bots} ĐANG TRỰC`;$('botEarnings').textContent=`ĐANG TẠO ¢${idleRate().toFixed(idleRate()%1?1:0)} / GIÂY · TỐI ĐA 8 GIỜ OFFLINE`;
    const requested=recipeById(state.orderId),visitor=factions.find(item=>item.id===state.orderFaction)||factions[0],customerDelayed=Date.now()<state.orderStarted,ghostActive=state.ghostOrder&&state.ghostOrder.expires>Date.now();$('orderIcon').textContent=ghostActive?'◌':visitor.icon;$('orderName').textContent=ghostActive?state.ghostOrder.name:customerDelayed?'Khách đang tránh mưa axit…':requested.name;$('orderRecipe').textContent=ghostActive?`Gọi món: ${state.ghostOrder.request} · không có trong thực đơn`:customerDelayed?'Mưa Axit đang trì hoãn khách.':`${state.orderVip?'KHÁCH VIP · ':''}${visitor.name} · ${requested.recipe}`;$('orderPay').innerHTML=ghostActive?`+? <small>đơn không tồn tại</small>`:customerDelayed?'ĐANG ĐỢI<small>khách tránh mưa axit</small>':`+¢${format(orderReward())}<small>${customerLikes(requested)?'hợp gu · thưởng thêm':'thưởng đúng món'}</small>`;$('orderNumber').textContent=`ĐƠN #${String(state.orderNumber).padStart(3,'0')}`;$('brewHint').textContent=ghostActive?'BÓNG NGƯỜI · KHÔNG THỂ CÓ TRONG MENU':customerDelayed?'MƯA AXIT · KHÁCH ĐANG TRÊN ĐƯỜNG':`${visitor.name.toUpperCase()} · ${customerLikes(requested)?'ĐÚNG GU':'ĐÚNG MÓN'}`;
    $('branchTitle').textContent=state.branches===1?'Góc Phố Mưa':`NEON BREW ${String(state.branches).padStart(2,'0')}`;$('branchDesc').textContent=`Thêm quán mới, tăng 35% thu nhập robot. ĐANG CÓ ${state.branches} ĐỊA ĐIỂM.`;$('branchButton').textContent=`¢ ${format(branchCost())}`;$('branchButton').dataset.cost=branchCost();$('branchButton').disabled=state.money<branchCost();$('botButton').dataset.cost=botCost();$('botButton').disabled=state.money<botCost();
    $('logList').innerHTML=state.log.length?state.log.map(entry=>`<div class="log-entry"><b>${escapeHtml(entry.time)} · ${escapeHtml(entry.label)}</b><span>${escapeHtml(entry.message)}</span></div>`).join(''):'<div class="log-entry"><b>CA ĐÊM · 00:00</b><span>Quán mở cửa. Thành phố đang chờ.</span></div>';
    $('levelBadge').textContent=`CẤP ${String(state.level).padStart(2,'0')}`;$('nextLevel').textContent=`CẤP ${String(state.level+1).padStart(2,'0')}`;const target=state.level*10;const within=state.reputation%target;$('repCurrent').textContent=`${format(within)} uy tín`;$('repTarget').textContent=`${target} uy tín`;$('repMeter').style.width=`${Math.min(100,within/target*100)}%`;$('progressText').textContent=state.level>=8?'Danh tiếng vang khắp Neo-Saigon':`${Math.max(0,target-within)} điểm nữa để lên cấp`;
    const upgradeCount=upgrades.filter(item=>state.upgrades[item.id]>0).length;$('upgradeCount').textContent=`${upgradeCount} / ${upgrades.length}`;$('upgradeMeter').style.width=`${upgradeCount/upgrades.length*100}%`;
    $('dayNumber').textContent=String(Math.max(1,Math.floor(state.served/25)+1)).padStart(2,'0');$('timeLabel').textContent='· '+clockText();$('sceneClock').textContent=clockText();$('shiftClock').textContent=`CA ĐÊM · ${clockText()}`;$('soundLabel').textContent=`NHẠC: ${state.audio?'BẬT':'TẮT'}`;$('soundIcon').textContent=state.audio?'◖':'♫';
    renderRecipes();renderUpgrades();renderFeatureViews();renderLive();
  }
  function renderLive(){
    const rate=idleRate(),totalRate=(rate+deliveryRate())*moneyMultiplier(),requested=recipeById(state.orderId);$('moneyValue').textContent='¢ '+format(state.money);$('servedValue').textContent=format(state.served);const stars=Array.from({length:5},(_,index)=>`<span class="star ${index<state.starRating?'filled':''}">${index<state.starRating?'★':'☆'}</span>`).join('');$('repValue').innerHTML=`${format(state.reputation)} <small>điểm danh tiếng</small><div class="star-row">${stars}</div>`;$('idleValue').innerHTML=`¢${rate.toFixed(rate%1?1:0)} <small>/ giây</small>`;$('incomeRate').textContent=`+¢${totalRate.toFixed(totalRate%1?1:0)}/s`;$('botCount').textContent=`${state.bots} ĐANG TRỰC`;$('botEarnings').textContent=`ĐANG TẠO ¢${rate.toFixed(rate%1?1:0)} / GIÂY · TỐI ĐA 8 GIỜ OFFLINE`;
    $('dayNumber').textContent=String(Math.max(1,Math.floor(state.served/25)+1)).padStart(2,'0');$('timeLabel').textContent='· '+clockText();$('sceneClock').textContent=clockText();$('shiftClock').textContent=`CA ĐÊM · ${clockText()}`;$('branchButton').disabled=state.money<branchCost();$('botButton').disabled=state.money<botCost();
    const target=state.level*10,within=state.reputation%target;$('repCurrent').textContent=`${format(within)} uy tín`;$('repMeter').style.width=`${Math.min(100,within/target*100)}%`;$('progressText').textContent=state.level>=8?'Danh tiếng vang khắp Neo-Saigon':`${Math.max(0,target-within)} điểm nữa để lên cấp`;
    const duration=Math.max(1,state.orderExpires-state.orderStarted),left=Math.min(100,Math.max(0,(state.orderExpires-Date.now())/duration*100));$('orderTimer').style.width=left+'%';$('orderTimer').style.background=left<25?'var(--pink)':'var(--amber)';$('weatherClock').textContent=`ĐỔI SAU ${Math.max(0,Math.ceil((state.weatherChangedAt-Date.now())/1000))}S`;
    const secondsQuest=document.querySelector('[data-quest="seconds"]');if(secondsQuest){const seconds=Math.min(900,Math.floor(state.daily.seconds));secondsQuest.querySelector('.quest-meta span:last-child').textContent=`${format(seconds)} / 900` ;secondsQuest.querySelector('.quest-meter i').style.width=`${seconds/900*100}%`}
    for(const button of document.querySelectorAll('[data-cost]'))button.disabled=button.dataset.owned==='true'||state.money<Number(button.dataset.cost);
    const selects=[$('ingredientA'),$('ingredientB'),$('ingredientC')],needed=Object.fromEntries(ingredients.map(item=>[item.id,selects.filter(select=>select.value===item.id).length]));$('researchButton').disabled=state.money<18||Object.entries(needed).some(([id,count])=>(state.inventory[id]||0)<count);
    $('matrixAlert').classList.toggle('active',state.matrixCyclesLeft>0);if(state.matrixCyclesLeft>0){$('matrixTime').textContent=String(Math.max(0,Math.ceil((state.matrixCycleEnds-Date.now())/1000)));$('matrixCycle').textContent=String(eventRules.matrixCycles-state.matrixCyclesLeft+1)}document.body.classList.toggle('matrix-glitch',state.matrixCyclesLeft>0);
    if(activeThreat)$('threatTimer').textContent=String(Math.max(0,Math.ceil((activeThreat.expires-Date.now())/1000)));if(state.bulkOrder){$('bulkOrderAlert').classList.add('active');$('bulkOrderText').textContent=`ĐƠN CORPORATE · ${state.bulkOrder.remaining}/${state.bulkOrder.total} MÓN · CÒN ${Math.max(0,Math.ceil((state.bulkOrder.expires-Date.now())/1000))}S`}else $('bulkOrderAlert').classList.remove('active');
  }
  function normalizeTutorialStep(){state.tutorialStep=Math.max(0,Math.min(6,state.tutorialStep||0))}
  function renderTutorial(){
    const step=Math.min(6,state.tutorialStep),recipe=recipeById(state.orderId),machine=upgrades.find(item=>item.id==='machine'),machineOwned=state.upgrades.machine>0,botOwned=state.bots>0,labVisited=state.researchTrials>0||state.unlockedRecipes.length>0||state.cyberWaste>0,branchOwned=state.branches>1,branchPrice=branchCost();
    const items=[
      {title:'Bước 1 · Đọc đơn hàng',copy:`Khách đang gọi ${recipe.name}. Tên món nằm ở dòng lớn; công thức cần pha là: ${recipe.recipe}. Trong bảng bên dưới có nhiều nút món, bạn phải chọn đúng món khách gọi.`,hint:`Bấm nút bên dưới để pha ${recipe.name}. Pha đúng sẽ nhận tiền và tăng danh tiếng. Mỗi lần pha cũng dùng nguyên liệu trong kho; pha sai vẫn mất nguyên liệu nhưng không nhận tiền đơn.`,action:`PHA ĐÚNG · ${recipe.name.toUpperCase()}`,ready:!activeBrew},
      {title:'Bước 2 · Nâng máy pha',copy:machineOwned?`Máy Ion-X đã ở cấp ${state.upgrades.machine}. Mỗi cấp tăng 15% tiền nhận được từ đơn pha chế.`:'Tiền ở ô SỐ DƯ phía trên màn hình. Máy Ion-X nằm trong mục Nâng cấp tiệm bên phải; mua một cấp sẽ tăng 15% tiền nhận từ các đơn đúng món.',hint:machineOwned?'Máy đã được nâng. Sang bước tiếp theo để thử một đơn nữa.':`Bấm nút bên dưới để mua Máy Ion-X với ¢${format(upgradeCost(machine))}. Khoản tiền sẽ bị trừ ngay; các đơn sau sẽ có thưởng cao hơn.`,action:machineOwned?'TIẾP TỤC · ĐÃ NÂNG MÁY':`MUA MÁY ION-X · ¢${format(upgradeCost(machine))}`,ready:machineOwned||state.money>=upgradeCost(machine)},
      {title:'Bước 3 · Pha đơn thứ hai',copy:`Đọc lại tên khách gọi: ${recipe.name}. Công thức gồm ${recipe.recipe}. Sau khi pha xong, đơn mới sẽ tự xuất hiện; bạn không cần tự mở đơn kế tiếp.`,hint:'Bấm nút bên dưới để pha đúng món. Hãy để ý tiền thưởng và thanh thời gian của khách: hết giờ thì khách rời đi và danh tiếng giảm.',action:`PHA ĐƠN THỨ HAI · ${recipe.name.toUpperCase()}`,ready:!activeBrew},
      {title:'Bước 4 · Thuê barista robot',copy:botOwned?`Bạn đã có ${state.bots} robot. Robot tự tạo tiền mỗi giây; khoản thu nhập này vẫn chạy khi bạn rời quán.`:'Robot R-08 tạo tiền tự động mỗi giây, kể cả khi bạn không bấm pha món. Robot không thay thế việc chọn công thức cho đơn khách; chúng giúp quán có thêm thu nhập nền.',hint:botOwned?'Robot đã vào ca. Tiếp theo bạn sẽ thử mở một công thức mới.':`Bấm nút bên dưới để thuê robot với ¢${format(botCost())}. Tiền thuê bị trừ một lần; sau đó tiền robot được cộng tự động.`,action:botOwned?'TIẾP TỤC · ROBOT ĐÃ VÀO CA':`THUÊ ROBOT · ¢${format(botCost())}`,ready:botOwned||state.money>=botCost()},
      {title:'Bước 5 · Thử nghiệm công thức',copy:labVisited?'Bạn đã thực hiện thử nghiệm. Công thức mới sẽ xuất hiện trong danh sách món để dùng ở các đơn sau.':'Phòng thí nghiệm dùng 3 ô nguyên liệu để tạo món mới. Mỗi lần thử tốn ¢18 và nguyên liệu đã chọn; kết quả có thể thành công hoặc thất bại. Thất bại tạo Rác thải Cyber.',hint:labVisited?'Đã hiểu phòng thí nghiệm. Bước kế tiếp là tích tiền mở chi nhánh.':'Bấm nút bên dưới để chuyển sang Phòng thí nghiệm. Hướng dẫn sẽ chọn sẵn 3 nguyên liệu mẫu và bắt đầu thử cho bạn.',action:labVisited?'TIẾP TỤC · ĐÃ THỬ NGHIỆM':'MỞ PHÒNG LAB · THỬ 1 LẦN',ready:labVisited||['espresso','plasma','boba'].every(id=>(state.inventory[id]||0)>0)},
      {title:'Bước 6 · Tích tiền mở chi nhánh',copy:branchOwned?`Bạn đã có ${state.branches} chi nhánh. Mỗi chi nhánh mới tăng 35% thu nhập robot.`:`Chi nhánh đầu tiên giá ¢${format(branchPrice)}. Mỗi lần bấm pha đúng món sẽ cộng tiền vào SỐ DƯ; hãy tích đủ số tiền này rồi mua chi nhánh.`,hint:branchOwned?'Đã mở chi nhánh. Bước cuối sẽ tóm tắt cách chơi tự do.':state.money>=branchPrice?`Bạn đã đủ tiền. Bấm nút dưới để mở chi nhánh với ¢${format(branchPrice)}.`:`Còn thiếu ¢${format(branchPrice-state.money)}. Bấm nút pha món bên dưới để làm đúng đơn hiện tại và nhận tiền. Lặp lại cho tới khi đủ ¢${format(branchPrice)}.`,action:branchOwned?'TIẾP TỤC · ĐÃ MỞ CHI NHÁNH':state.money>=branchPrice?`MỞ CHI NHÁNH · ¢${format(branchPrice)}`:'PHA ĐÚNG ĐƠN ĐỂ TÍCH TIỀN',ready:branchOwned||!activeBrew},
      {title:'Bước 7 · Tự mình điều hành',copy:'Vòng chơi chính rất đơn giản: đọc món khách gọi, pha đúng công thức trước khi hết giờ, rồi dùng tiền để nâng cấp quán. Các mục QUẦY, PHÒNG THÍ NGHIỆM, THÀNH PHỐ và NHIỆM VỤ & LƯU nằm trên thanh tab.',hint:'Bạn có thể bấm nút ? trên thanh trên cùng để xem lại hướng dẫn. Nút BỎ QUA đóng hướng dẫn ngay; tiến trình hiện tại vẫn được lưu.',action:'BẮT ĐẦU CA ĐÊM',ready:true}
    ];
    const item=items[step];
    const counter=`${String(step+1).padStart(2,'0')} / 07`;
    $('tutorialHeading').textContent=item.title;$('tutorialText').textContent=item.copy;$('tutorialHint').textContent=item.hint;$('tutorialContinue').textContent=item.action;$('tutorialContinue').disabled=!item.ready;$('tutorialCounter').textContent=counter;$('tutorialProgress').style.width=`${step/6*100}%`;
    $('tutorialDockCounter').textContent=counter;$('tutorialDockHeading').textContent=item.title;$('tutorialDockText').textContent=item.copy;$('tutorialDockHint').textContent=item.hint;
    $('tutorialScreen').hidden=guidedOutside;$('tutorialDock').hidden=!guidedOutside;updateTutorialTarget();
  }
  function updateTutorialTarget(){
    document.querySelectorAll('.tutorial-target').forEach(element=>element.classList.remove('tutorial-target'));
    if(!tutorialActive||!guidedOutside)return;
    const selectors={0:'.recipe-btn.match',1:'#upgradeList .upgrade:first-child .buy-btn',2:'.recipe-btn.match',3:'#botButton',4:document.querySelector('#view-research.active')?'#researchButton':'[data-view="research"]',5:state.money>=branchCost()?'#branchButton':'.recipe-btn.match'};
    const target=document.querySelector(selectors[state.tutorialStep]);
    if(target)target.classList.add('tutorial-target');
  }
  function enableOutsideTutorial(){if(!tutorialActive)return;guidedOutside=true;$('tutorialScreen').hidden=true;$('gameShell').inert=false;$('tutorialDock').hidden=false;document.body.classList.add('tutorial-guided');renderTutorial();save()}
  function reopenTutorial(){if(!tutorialActive)return;guidedOutside=false;$('gameShell').inert=true;$('tutorialDock').hidden=true;document.body.classList.remove('tutorial-guided');renderTutorial()}
  function setTutorialOrder(){state.orderId='meteor';state.orderFaction='hackers';state.orderVip=false;state.orderStarted=Date.now();state.orderExpires=Date.now()+45000}
  function startTutorial(){if(state.tutorialDone)return;tutorialActive=true;guidedOutside=false;$('gameShell').inert=true;document.body.classList.remove('tutorial-guided');normalizeTutorialStep();if(state.tutorialStep===0||state.tutorialStep===2)setTutorialOrder();render();renderTutorial();save()}
  function advanceTutorial(){if(!tutorialActive)return;if(state.tutorialStep===5&&state.branches<2){render();renderTutorial();save();return}state.tutorialStep=Math.min(6,state.tutorialStep+1);if(state.tutorialStep===2)setTutorialOrder();render();renderTutorial();save()}
  function finishTutorial(){if(!tutorialActive)return;state.tutorialDone=true;state.tutorialStep=6;tutorialActive=false;guidedOutside=false;$('tutorialScreen').hidden=true;$('tutorialDock').hidden=true;$('gameShell').inert=false;document.body.classList.remove('tutorial-guided');document.querySelectorAll('.tutorial-target').forEach(element=>element.classList.remove('tutorial-target'));document.querySelector('[data-view="shop"]').click();save()}
  function doTutorialAction(){if(!tutorialActive)return;switch(state.tutorialStep){case 0:brew('meteor');break;case 1:if(state.upgrades.machine>0)advanceTutorial();else buyUpgrade(upgrades.find(item=>item.id==='machine'));break;case 2:brew('meteor');break;case 3:if(state.bots>0)advanceTutorial();else $('botButton').click();break;case 4:if(state.researchTrials>0||state.unlockedRecipes.length>0||state.cyberWaste>0){advanceTutorial();break}if(state.money<18)state.money=18;document.querySelector('[data-view="research"]').click();[['ingredientA','espresso'],['ingredientB','plasma'],['ingredientC','boba']].forEach(([id,value])=>{const select=$(id);select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}))});craftResearch();break;case 5:if(state.branches>1)advanceTutorial();else if(state.money>=branchCost())$('branchButton').click();else{setTutorialOrder();brew('meteor')}break;default:finishTutorial()}}
  function skipTutorial(){if(!tutorialActive)return;state.tutorialDone=true;state.tutorialStep=6;tutorialActive=false;guidedOutside=false;$('tutorialScreen').hidden=true;$('tutorialDock').hidden=true;$('gameShell').inert=false;document.body.classList.remove('tutorial-guided');document.querySelectorAll('.tutorial-target').forEach(element=>element.classList.remove('tutorial-target'));save()}
  function replayTutorial(){if(!sessionStarted){state.tutorialDone=false;state.tutorialStep=0;save();return}state.tutorialDone=false;state.tutorialStep=0;setTutorialOrder();startTutorial()}
  function escapeHtml(text){return String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
  function craftResearch(){
    if(state.money<18)return;const selected=[$('ingredientA').value,$('ingredientB').value,$('ingredientC').value],counts=Object.fromEntries(ingredients.map(item=>[item.id,selected.filter(id=>id===item.id).length]));
    if(Object.entries(counts).some(([id,count])=>(state.inventory[id]||0)<count)){toast('Không đủ nguyên liệu cho công thức này.');return}
    state.money-=18;state.researchTrials++;for(const [id,count] of Object.entries(counts))state.inventory[id]-=count;const success=Math.random()<researchChance(),key=[...selected].sort().join('_');
    if(!success){state.researchFailures++;state.cyberWaste++;$('researchResult').textContent='☣ Thất bại! Mẻ pha biến thành Rác thải Cyber.';addLog('Thử nghiệm lỗi, thu được Rác thải Cyber.','Phòng lab')}
    else{const existing=state.unlockedRecipes.find(recipe=>recipe.comboKey===key),legendary=Math.random()<.08;if(existing){const salvage=(legendary?50:20)*moneyMultiplier();state.money+=salvage;$('researchResult').textContent=`✦ Công thức trùng lặp, tái chế thành ¢${format(salvage)}.`;addLog(`Tái chế mẻ pha trùng · +¢${format(salvage)}.`,'Phòng lab')}
      else{const parts=selected.map(id=>ingredients.find(item=>item.id===id)),tags=[...new Set(parts.map(item=>item.tag))],basePrice=30+parts.reduce((sum,item)=>sum+item.cost,0),recipe={id:`lab_${key}`,comboKey:key,name:legendary?'Aurora Huyền Thoại':`${parts[0].name.split(' ')[0]} ${parts[1].name.split(' ')[0]} ${parts[2].name.split(' ')[0]}`,icon:legendary?'✨':'🧪',short:'Lab',details:parts.map(item=>item.name).join(' · '),recipe:parts.map(item=>item.name).join(' · '),price:basePrice,tags:legendary?[...tags,'premium']:tags,legendary};state.unlockedRecipes.push(recipe);state.factionRep.hackers++;$('researchResult').textContent=legendary?`✧ Thành công xuất sắc! ${recipe.name} bán với giá trị x5.`:`✦ Khám phá thành công: ${recipe.name}. Công thức mới đã mở khóa.`;addLog(`Mở khóa ${recipe.name}${legendary?' · HUYỀN THOẠI ×5':''}.`,'Phòng lab')}}
    if(success&&state.unlockedRecipes.some(recipe=>recipe.comboKey===key))state.researchSuccesses++;
    document.body.classList.add('glitch');setTimeout(()=>document.body.classList.remove('glitch'),220);checkBadges();render();save();advanceTutorial()
  }
  function buyIngredient(id){const item=ingredients.find(entry=>entry.id===id);if(!item||state.money<item.cost)return;state.money-=item.cost;state.inventory[id]=(state.inventory[id]||0)+1;render();save();toast(`${item.name} đã nhập kho.`)}
  function recycleWaste(){if(state.cyberWaste<1)return;const recovered=state.cyberWaste*5*moneyMultiplier();state.cyberWaste=0;state.money+=recovered;render();save();toast(`Tái chế rác thải Cyber · +¢${format(recovered)}.`)}
  function buyDecor(id){const item=decorItems.find(entry=>entry.id===id);if(!item||state.decorations[id]||state.money<item.cost)return;state.money-=item.cost;state.decorations[id]=true;addLog(`Đã lắp ${item.name}.`,'Trang trí');render();save();toast(`${item.name} đã lắp đặt.`)}
  function buyFirewall(){const cost=firewallCost();if(state.money<cost)return;state.money-=cost;state.firewall++;addLog(`Nâng Firewall lên cấp ${state.firewall}.`,'An ninh');render();save();toast('Firewall đã bật. Kỹ năng hack ngược được mở khóa.')}
  function buyDeliveryDrone(){const cost=deliveryDroneCost();if(state.money<cost)return;state.money-=cost;state.deliveryDrone++;addLog('Mua thêm drone Cyber-Delivery.','Giao hàng');render();save();toast('Đội bay giao hàng đã mở rộng.')}
  function toggleDelivery(){if(!state.deliveryDrone)return;state.deliveryActive=!state.deliveryActive;render();save();toast(state.deliveryActive?'Đội drone sẵn sàng giao hàng trong Bão Axit.':'Đã cho đội drone nghỉ.')}
  function buyTrack(id){const track=tracks.find(entry=>entry.id===id);if(!track)return;if(!state.tracks.includes(id)){if(state.money<track.cost)return;state.money-=track.cost;state.tracks.push(id);addLog(`Mua đĩa ${track.name}.`,'Jukebox')}state.trackId=id;render();save();toast(`${track.name} đã được chọn trong Jukebox.`)}
  function claimDaily(){if(state.daily.rewarded)return;const progress=dailyProgress();if(progress.espresso<200||progress.hackers<3||progress.seconds<900)return;state.daily.rewarded=true;state.chips++;addLog('Hoàn tất nhiệm vụ ngày · nhận 1 Quantum Chip.','Nhiệm vụ');render();save();toast('Nhận 1 Quantum Chip!')}
  function doPrestige(){if(state.served<200||state.chips<1||!window.confirm('Chuyển sinh sẽ đặt lại cửa hàng, nâng cấp, công thức và tiến độ nhiệm vụ; giữ Quantum Chips, huy hiệu và nhiệm vụ đã nhận hôm nay. Tiếp tục?'))return;const firstRebirth=!state.badges.rebirth,chips=state.chips-1+(firstRebirth?1:0),prestiges=state.prestiges+1,badges={...state.badges,rebirth:true},daily={...state.daily};state=initialState();state.chips=chips;state.prestiges=prestiges;state.badges=badges;state.daily=daily;for(const item of upgrades)state.upgrades[item.id]=0;addLog('Chuyển sinh · tiêu thụ 1 QC, hệ số doanh thu tăng 5%.','Chuyển sinh');render();save();toast('Tái khởi động thành công. Hệ số doanh thu tăng vĩnh viễn.')}
  function startThreat(){if(activeThreat)return;const kind=eventRules.securityKind(()=>Math.random());if(kind==='ransomware'){state.ransomwareIncidents++;showIncident(kind,storyEvents.ransomware.title,storyEvents.ransomware.copy,'Chọn cách xử lý trong 25 giây.',25000,['payThreat','reinstallThreat','hackThreat']);$('payThreat').textContent=`TRẢ CHUỘC · −10% (¢${format(eventRules.ransom(state.money))})`;$('reinstallThreat').textContent='CÀI LẠI FIRMWARE · 2 PHÚT';$('hackThreat').textContent=state.firewall?'HACK NGƯỢC · LẤY ¢'+format(eventRules.ransom(state.money)*2):'HACK NGƯỢC · CẦN FIREWALL';$('hackThreat').disabled=state.firewall<1;return}if(kind==='union'){showIncident(kind,storyEvents.union.title,storyEvents.union.copy,'Đồng ý tốn thêm 5% bảo trì mỗi giờ, robot nhanh hơn 15%. Format có rủi ro.',25000,['acceptUnion','formatRobots']);return}const {left,right,answer}=eventRules.challenge(()=>Math.random(),kind),defense=kind==='hacker'?state.drone:state.bouncer,yakuza=kind==='gang'&&state.yakuzaProtectionUntil>Date.now();if(yakuza||(defense&&Math.random()<Math.min(.92,.5+defense*.15))){state.securityEvictions++;if(kind==='hacker')state.daily.hackers++;state.factionRep[kind==='hacker'?'hackers':'samurai']+=1;$('securityStatus').textContent=yakuza?'Yakuza chặn băng đảng đối thủ theo thỏa thuận bảo kê.':`${kind==='hacker'?'Drone':'Bouncer'} tự động đẩy lùi khách không mời.`;addLog('Đội an ninh tự động đẩy lùi khách không mời.','An ninh');render();save();return}const pay=Math.ceil(55+Math.random()*45);activeThreat={kind,answer,expires:Date.now()+15000,pay};showIncident(kind,kind==='hacker'?'Hacker đòi tiền chuộc':'Băng đảng đòi bảo kê',kind==='hacker'?'Một hacker khóa hệ thống bán hàng. Giải mã nhanh hoặc mất tiền.':'Băng đảng chặn cửa. Giải câu đố bảo mật để đuổi chúng đi.','',15000,['payThreat','solveThreat'],`Xác minh: ${left} ${kind==='hacker'?'×':'+'} ${right} = ?`);$('payThreat').textContent=`TRẢ ¢${format(pay)}`}
  function resolveThreat(success,paid=false){
    if(!activeThreat)return;const kind=activeThreat.kind,now=Date.now();
    if(kind==='ransomware'){const ransom=eventRules.ransom(state.money);if(paid){state.money=Math.max(0,state.money-ransom);state.stalledUntil=0;$('securityStatus').textContent='Đã trả 10% tiền chuộc. Robot hoạt động lại ngay.'}else{state.stalledUntil=now+120000;$('securityStatus').textContent='Đang cài lại firmware. Robot sẽ trở lại sau 2 phút.'}addLog(paid?'Trả 10% quỹ chuộc robot.':'Cài lại firmware, robot tạm dừng 2 phút.','Ransomware')}
    else if(kind==='union'){if(paid){state.robotUnion=true;state.maintenanceDueAt=now+3600000;$('securityStatus').textContent='Chấp nhận yêu cầu Liên đoàn. Robot nhanh hơn 15% vĩnh viễn.';addLog('Chấp nhận thỏa thuận dầu nhớt và sạc pin.','Liên đoàn Robot')}else if(eventRules.formatSucceeds(()=>Math.random())){$('securityStatus').textContent='Đe dọa format thành công. Robot quay lại làm việc.';addLog('Robot chấp nhận quay lại làm việc.','Liên đoàn Robot')}else{state.bots=Math.max(0,state.bots-1);$('securityStatus').textContent='Format thất bại. Một robot đã nổ tung.';addLog('Mất một robot sau khi đe dọa format.','Liên đoàn Robot')}}
    else if(paid){state.money=Math.max(0,state.money-activeThreat.pay);$('securityStatus').textContent='Đã trả tiền để kết thúc vụ việc.'}
    else if(success){const reward=35*moneyMultiplier();state.money+=reward;state.reputation+=1;state.securityEvictions++;state.factionRep[kind==='hacker'?'hackers':'samurai']+=2;if(kind==='hacker')state.daily.hackers++;$('securityStatus').textContent=`Xác minh thành công. +¢${format(reward)}.`}
    else{const fine=activeThreat.pay;state.money=Math.max(0,state.money-fine);if(kind==='hacker'&&!state.decorations.airFilter&&state.bots>0)state.stalledUntil=now+30000;$('securityStatus').textContent=`Quá thời gian. Mất ¢${format(fine)}${state.stalledUntil?' · robot tạm ngưng 30 giây':''}.`}
    finishIncident($('securityStatus').textContent,'An ninh')
  }
  function hackRansomware(){if(!activeThreat||activeThreat.kind!=='ransomware'||state.firewall<1)return;const reward=eventRules.ransom(state.money)*2*moneyMultiplier();if(eventRules.hackSucceeds(()=>Math.random(),state.firewall)){state.money+=reward;state.stalledUntil=0;finishIncident(`Firewall diệt virus và hack ngược · +¢${format(reward)}.`,'Firewall')}else{state.stalledUntil=Date.now()+120000;finishIncident('Hack ngược thất bại. Robot đang cài lại firmware 2 phút.','Firewall')}}
  function resolveUnion(accept){if(!activeThreat||activeThreat.kind!=='union')return;resolveThreat(false,accept)}
  function orderReviewPercent(correct, liked, vip){
    let score = correct ? 78 : 8;
    if(correct && liked) score += 12;
    if(correct && vip) score += 10;
    if(correct && Date.now() < state.orderExpires) score += 6;
    if(!correct) score = Math.max(0, score - 35);
    return Math.max(0, Math.min(100, score));
  }
  function orderReputationDelta(correct, liked, vip){
    const percent = orderReviewPercent(correct, liked, vip);
    return correct ? Math.round(percent / 20) : -Math.max(2, Math.round((100 - percent) / 12));
  }
  function expireOrderPenalty(){
    state.badOrders++;
    state.reputation = Math.max(0, state.reputation - 1);
    state.reviewScore = Math.max(0, state.reviewScore - 20);
    updateStarRating();
    toast('Khách hết giờ — khách bực, danh tiếng giảm 1!');
    addLog('Khách hết giờ và rời quán. Danh tiếng giảm 1.','Hết giờ');
  }
  function autoCompleteOrderByBot(){
    const recipe = recipeById(state.orderId);
    if(!recipe)return false;
    const base = recipe.price * (recipe.legendary ? 5 : 1) * (0.85 + state.bots * 0.12);
    const earned = Math.max(12, Math.round(base * moneyMultiplier()));
    state.money += earned;
    state.served++;
    state.reputation = Math.max(0, state.reputation + 1);
    state.reviewScore = Math.min(100, Math.max(0, state.reviewScore + 10));
    updateStarRating();
    addLog(`Robot hoàn tất đơn ${recipe.name} · +¢${format(earned)} · không trừ sao.`,'Robot');
    toast(`Robot hoàn tất đơn! +¢${format(earned)} · không mất sao.`);
    return true;
  }
  function brew(recipeId){
    if(activeBrew)return;if(Date.now()<state.orderStarted){toast('Khách đang tránh mưa axit.');return}const recipe=recipeById(recipeId);if(!recipe)return;
    const neededIngredients = recipeIngredientIds(recipe.id);
    const missingIngredient = neededIngredients.find(id => (state.inventory[id] || 0) <= 0);
    if (missingIngredient) {
      const item = ingredients.find(entry => entry.id === missingIngredient);
      toast(`Thiếu nguyên liệu ${item ? item.name : missingIngredient}.`);
      return;
    }
    activeBrew=true;$('brewShade').classList.add('show');document.body.classList.add('glitch');renderRecipes();if(tutorialActive)renderTutorial();const duration=Math.max(350,1250-state.upgrades.grinder*115-(factionBonus('hackers')>=10?160:0));
    brewTimer=setTimeout(()=>{
      const correct=recipe.id===state.orderId,liked=customerLikes(recipe),weatherHot=state.weatherId==='acid'&&(recipe.tags||[]).includes('hot');let earned=0;
      const reviewPercent = orderReviewPercent(correct, liked, state.orderVip);
      const repDelta = orderReputationDelta(correct, liked, state.orderVip);
      state.reviewScore = Math.max(0, Math.min(100, (state.reviewScore * 0.7) + (reviewPercent * 0.3)));
      for (const id of neededIngredients) {
        state.inventory[id] = Math.max(0, (state.inventory[id] || 0) - 1);
      }
      if(correct){
        earned=recipe.price*(recipe.legendary?5:1);
        if(weatherHot)earned*=1.5;if(state.orderVip)earned*=1.5;if(state.orderFaction==='corporate')earned*=1.5;if(state.orderFaction==='corporate'&&factionBonus('corporate')>=10)earned*=1.15;if(state.decorations.pixelFloor)earned*=1.2;
        if(liked&&state.orderFaction==='samurai')earned*=1.2;if(liked&&state.orderFaction==='cyborgs'&&factionBonus('cyborgs')>=25)earned*=1.2;if(state.arenaBuffUntil>Date.now()&&state.orderFaction==='cyborgs')earned*=2;
        earned*=shopMultiplier();if(state.upgrades.tipJar)earned*=1.1;earned+=orderBonus();earned=Math.round(earned*moneyMultiplier());state.money+=earned;state.lifetimeEarned=(state.lifetimeEarned||0)+earned;
        state.served++;state.lifetimeServed=(state.lifetimeServed||0)+1;state.xp+=3;
      } else {
        state.badOrders++;state.starRating=Math.max(0,state.starRating-1);toast('Sai món — đánh giá khách thấp, bạn mất 1 sao!');addLog(`Sai đơn ${recipe.name}. Khách phàn nàn và mức đánh giá giảm.`, 'Đánh giá');
      }
      state.reputation=Math.max(0, state.reputation + repDelta);
      if(liked)state.factionRep[state.orderFaction]+=correct?2:1;if(recipe.id==='meteor'||(recipe.tags||[]).includes('caffeine'))state.daily.espresso++;
      updateStarRating();while(state.reputation>=state.level*10)state.level++;advanceBulkOrder();checkBadges();addLog(`${correct?'Đúng đơn':'Sai đơn '+recipe.short}${liked&&correct?' · hợp gu '+state.orderFaction:''} · ${correct?`KPI ${reviewPercent}% · nhận ¢${format(earned)}`:`KPI ${reviewPercent}% · mất ${Math.abs(repDelta)} danh tiếng`}.`,correct?'Đơn hoàn tất':'Đánh giá');
      activeBrew=false;$('brewShade').classList.remove('show');setTimeout(()=>document.body.classList.remove('glitch'),180);newOrder(false);render();save();toast(correct?`Pha đúng đơn! KPI ${reviewPercent}% · +¢${format(earned)} · danh tiếng +${repDelta}${liked?' · khách hài lòng':''}.`:`Sai món! KPI ${reviewPercent}% · mất ${Math.abs(repDelta)} danh tiếng và 1 sao.`);
      if(recipe.id==='ramen')showStoryEvent('yakuza');else if(recipe.id==='overclock')showStoryEvent('bulk');else if(recipe.id==='bionic')showStoryEvent('arena');advanceTutorial();
    },duration)
  }
  function buyUpgrade(item){if(!item||item.oneTime&&state.upgrades[item.id]>0)return;const cost=upgradeCost(item);if(state.money<cost)return;state.money-=cost;state.upgrades[item.id]++;state.lifetimeUpgrades=(state.lifetimeUpgrades||0)+1;addLog(`${item.name} nâng lên cấp ${state.upgrades[item.id]}.`,'Nâng cấp');render();save();toast(`${item.name} đã được nâng cấp.`);advanceTutorial()}
  $('botButton').addEventListener('click',()=>{const cost=botCost();if(state.money<cost)return;state.money-=cost;state.bots++;addLog('Tuyển thêm barista robot R-08.','Tuyển dụng');render();save();toast('Robot mới đã vào ca. Thu nhập tự động tăng!');advanceTutorial()});
  $('branchButton').addEventListener('click',()=>{const cost=branchCost();if(state.money<cost)return;state.money-=cost;state.branches++;addLog(`Mở địa điểm Neon Brew số ${state.branches}.`,'Mở rộng');render();save();toast('Chi nhánh mới đã sáng đèn!');advanceTutorial()});
  document.querySelectorAll('.game-tab').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.game-tab').forEach(tab=>{tab.classList.toggle('active',tab===button);tab.setAttribute('aria-selected',String(tab===button))});document.querySelectorAll('.view-page').forEach(view=>view.classList.toggle('active',view.id===`view-${button.dataset.view}`));if(guidedOutside)updateTutorialTarget();document.body.classList.add('glitch');setTimeout(()=>document.body.classList.remove('glitch'),180)}));
  $('researchButton').addEventListener('click',craftResearch);['ingredientA','ingredientB','ingredientC'].forEach(id=>$(id).addEventListener('change',renderFeatureViews));$('ingredientStock').addEventListener('click',event=>{const buy=event.target.closest('[data-buy-ingredient]'),recycle=event.target.closest('[data-recycle-waste]');if(buy)buyIngredient(buy.dataset.buyIngredient);if(recycle)recycleWaste()});$('decorGrid').addEventListener('click',event=>{const button=event.target.closest('[data-buy-decor]');if(button)buyDecor(button.dataset.buyDecor)});$('trackList').addEventListener('click',event=>{const button=event.target.closest('[data-track]');if(button)buyTrack(button.dataset.track)});$('questList').addEventListener('click',event=>{if(event.target.closest('[data-action="claim-quest"]'))claimDaily()});
  $('buyDrone').addEventListener('click',()=>{const cost=Math.ceil(220*Math.pow(1.7,state.drone));if(state.money<cost)return;state.money-=cost;state.drone++;addLog('Nâng cấp drone an ninh.','An ninh');render();save();toast('Drone an ninh đã nâng cấp.')});$('buyBouncer').addEventListener('click',()=>{const cost=Math.ceil(280*Math.pow(1.7,state.bouncer));if(state.money<cost)return;state.money-=cost;state.bouncer++;addLog('Thuê thêm robot bouncer.','An ninh');render();save();toast('Robot Bouncer đã vào ca.')});$('buyFirewall').addEventListener('click',buyFirewall);$('buyDeliveryDrone').addEventListener('click',buyDeliveryDrone);$('toggleDelivery').addEventListener('click',toggleDelivery);
  $('payThreat').addEventListener('click',()=>resolveThreat(false,true));$('reinstallThreat').addEventListener('click',()=>resolveThreat(false));$('hackThreat').addEventListener('click',hackRansomware);$('acceptUnion').addEventListener('click',()=>resolveUnion(true));$('formatRobots').addEventListener('click',()=>resolveUnion(false));$('acceptStory').addEventListener('click',()=>resolveStoryEvent(true));$('declineStory').addEventListener('click',()=>resolveStoryEvent(false));$('solveThreat').addEventListener('click',()=>{if(!activeThreat||activeStoryEvent)return;if(Number($('threatAnswer').value)===activeThreat.answer)resolveThreat(true);else{$('threatAnswer').value='';$('threatAnswer').placeholder='Sai mã · thử lại nhanh';$('threatAnswer').focus()}});$('threatAnswer').addEventListener('keydown',event=>{if(event.key==='Enter')$('solveThreat').click()});
  $('crtToggle').addEventListener('click',()=>{state.crt=!state.crt;renderFeatureViews();save()});$('prestigeButton').addEventListener('click',doPrestige);
  $('themeSelect').addEventListener('change',()=>{uiSettings.theme=$('themeSelect').value;saveUiSettings();applyUiSettings()});$('languageSelect').addEventListener('change',()=>{uiSettings.language=$('languageSelect').value;saveUiSettings();render();applyUiSettings()});$('quickLanguageSelect').addEventListener('change',()=>{uiSettings.language=$('quickLanguageSelect').value;saveUiSettings();render();applyUiSettings()});$('introLanguageSelect').addEventListener('change',()=>{uiSettings.language=$('introLanguageSelect').value;saveUiSettings();render();applyUiSettings()});
  $('exportSave').addEventListener('click',()=>{const bytes=new TextEncoder().encode(JSON.stringify({game:'neon-brew',version:1,state}));const binary=Array.from(bytes,byte=>String.fromCharCode(byte)).join('');$('saveText').value=btoa(binary);$('saveMessage').textContent='Đã tạo mã lưu. Hãy sao chép để chuyển sang thiết bị khác.'});$('copySave').addEventListener('click',async()=>{if(!$('saveText').value){$('exportSave').click()}try{await navigator.clipboard.writeText($('saveText').value);$('saveMessage').textContent='Đã sao chép mã lưu vào clipboard.'}catch{$('saveText').focus();$('saveText').select();document.execCommand('copy');$('saveMessage').textContent='Đã chọn mã lưu để sao chép.'}});
  $('importSave').addEventListener('click',()=>{try{const raw=$('saveText').value.trim(),bytes=Uint8Array.from(atob(raw),char=>char.charCodeAt(0)),bundle=JSON.parse(new TextDecoder().decode(bytes));if(bundle.game!=='neon-brew'||bundle.version!==1||!bundle.state||typeof bundle.state!=='object'||!Number.isFinite(bundle.state.money)||!Number.isFinite(bundle.state.served)||!Array.isArray(bundle.state.unlockedRecipes))throw new Error('Mã lưu không hợp lệ.');for(const recipe of bundle.state.unlockedRecipes){if(!recipe||typeof recipe.id!=='string'||typeof recipe.name!=='string'||typeof recipe.price!=='number')throw new Error('Công thức trong mã lưu không hợp lệ.');recipe.name=recipe.name.slice(0,48);recipe.short=String(recipe.short||'Lab').slice(0,20);recipe.details=String(recipe.details||'').slice(0,100);recipe.recipe=String(recipe.recipe||recipe.details).slice(0,120);recipe.icon=String(recipe.icon||'🧪').slice(0,4);recipe.tags=Array.isArray(recipe.tags)?recipe.tags.filter(tag=>['caffeine','bold','energy','legend','premium','hot'].includes(tag)):[]}localStorage.setItem(STORE_KEY,JSON.stringify(bundle.state));$('saveMessage').textContent='Đã nhập save. Đang mở lại tiệm...';setTimeout(()=>location.reload(),250)}catch(error){$('saveMessage').textContent=error.message||'Không thể đọc mã lưu.'}});
  $('importSave').addEventListener('click',()=>{if($('saveMessage').textContent.startsWith('Đã nhập save'))isResetting=true});
  function ensureDaily(){if(state.daily.date===dayKey())return false;state.daily={date:dayKey(),espresso:0,hackers:0,seconds:0,rewarded:false};return true}
  function tick(){
    if(!sessionStarted||tutorialActive)return;
    const current=Date.now(),visible=document.visibilityState==='visible',delta=Math.min(1.5,Math.max(0,(current-(Number(state.lastSeen)||current))/1000));if(ensureDaily())renderFeatureViews();
    if(state.hallucinationUntil && current > state.hallucinationUntil){state.hallucinationUntil=0;addLog('Ánh sáng trở lại. Chỉ là ảo giác, hay thực sự là dấu vết?','Áo đen');}
    if(state.ghostOrder && current > state.ghostOrder.expires){state.ghostOrder=null;applyParanoia(5);addLog('Khi bạn quay lại, bóng người lạ đã biến mất, để lại một khoảng trống vô nghĩa.','Cửa kính');}
    if(!state.gameOver && state.served >= 5 && state.horrorPhase === 0){
      triggerMysteriousCustomer();
    }else if(current - state.lastHorrorAt > 26000 && !state.gameOver && state.served >= 5){
      const roll=Math.random();
      if(roll < .32){triggerMysteriousCustomer();}
      else if(roll < .62){triggerHallucination();}
      else if(roll < .9){triggerRobotWhisper();}
      else if(state.loreFragments.length < 2){addLoreFragment('Dưới quầy, bạn phát hiện một lớp sơn mới được phủ lên ngay trước khi quán đổi tên.');}
    }
    if(current>=state.matrixCycleEnds&&state.matrixCyclesLeft>0){state.matrixCyclesLeft--;if(state.matrixCyclesLeft>0)state.matrixCycleEnds=current+10000;else{state.matrixNextAt=current+180000;document.body.classList.remove('matrix-glitch')}}if(state.matrixCyclesLeft===0&&current>=state.matrixNextAt)startMatrixLoop();
    let passiveIncome=idleRate()*delta;if(state.weatherId==='acid'&&state.deliveryActive)passiveIncome+=deliveryRate()*delta;if(state.matrixCyclesLeft>0)passiveIncome*=3;if(passiveIncome>0)state.money+=passiveIncome;
    if(state.robotUnion&&current>=state.maintenanceDueAt){state.money=Math.max(0,state.money-Math.ceil(state.bots*.5));state.maintenanceDueAt=current+3600000;addLog('Đã thanh toán bảo trì theo thỏa thuận Liên đoàn Robot.','Bảo trì')}
    if(visible)state.daily.seconds+=delta;state.lastSeen=current;
    if(state.gameOver)return;
    if(state.starRating<2){state.inspectionProgress+=delta*1000;if(!state.inspectionActive){state.inspectionActive=true;toast('Kiểm tra thực phẩm bắt đầu: uy tín dưới 2 sao!');addLog('Uy tín dưới 2 sao. Bắt đầu kiểm tra thực phẩm.','Kiểm tra');}if(state.inspectionProgress>=30000)triggerGameOver('Uy tín dưới 2 sao quá lâu. Kiểm tra thực phẩm vào cuộc và quán bị đóng cửa.');}
    else{state.inspectionProgress=0;state.inspectionActive=false}
    if(current>=state.orderExpires&&!activeBrew){
      if(timerNotice!==state.orderNumber){
        timerNotice=state.orderNumber;
        const botAutoComplete = state.bots > 0 && Math.random() < Math.min(0.95, 0.3 + state.bots * 0.12);
        if(botAutoComplete){
          if(autoCompleteOrderByBot()){
            addLog('Robot xử lý đơn đúng thời hạn. Không có trừ sao.','Robot');
          }
        }else{
          expireOrderPenalty();
          addLog('Khách đổi ý, đơn mới đang chờ.','Hết giờ');
        }
      }
      newOrder(false,true);render()
    }
    if(current>=state.orderShuffleAt&&!activeBrew){newOrder(false,true);render()}
    if(current>=state.weatherChangedAt){const choices=weathers.filter(item=>item.id!==state.weatherId);state.weatherId=choices[Math.floor(Math.random()*choices.length)].id;state.weatherChangedAt=current+90000;addLog(`Thời tiết chuyển sang ${weathers.find(item=>item.id===state.weatherId).name}.`,'Thành phố');render()}
    if(current>=state.securityNextAt){state.securityNextAt=current+securityDelay();startThreat()}
    if(activeThreat&&current>=activeThreat.expires){if(activeStoryEvent)resolveStoryEvent(false);else if(activeThreat.kind==='union'){state.stalledUntil=current+30000;finishIncident('Liên đoàn đình công. Robot tạm dừng 30 giây.','Liên đoàn Robot')}else resolveThreat(false)}
    if(state.bulkOrder&&current>=state.bulkOrder.expires){state.bulkOrder=null;addLog('Hết giờ đơn hàng tập đoàn.','Sự kiện');toast('Đơn hàng số lượng lớn đã hết hạn.')}
    const duration=Math.max(1,state.orderExpires-state.orderStarted),left=Math.min(100,Math.max(0,(state.orderExpires-current)/duration*100));$('orderTimer').style.width=left+'%';$('orderTimer').style.background=left<25?'var(--pink)':'var(--amber)';renderLive();if(current%5000<1000)save()
  }
  $('resetButton').addEventListener('click',()=>$('resetDialog').classList.add('show'));$('cancelReset').addEventListener('click',()=>$('resetDialog').classList.remove('show'));$('confirmReset').addEventListener('click',()=>{localStorage.removeItem(STORE_KEY);location.reload()});$('gameOverReset').addEventListener('click',()=>{localStorage.removeItem(STORE_KEY);location.reload()});$('resetDialog').addEventListener('click',event=>{if(event.target===$('resetDialog'))$('resetDialog').classList.remove('show')});document.addEventListener('keydown',event=>{if(event.key==='Escape')$('resetDialog').classList.remove('show')});
  function playAudioStep(){if(!audioContext)return;const notes=(tracks.find(item=>item.id===state.trackId)||tracks[0]).notes,time=audioContext.currentTime;const osc=audioContext.createOscillator(),gain=audioContext.createGain(),filter=audioContext.createBiquadFilter();osc.type='triangle';osc.frequency.value=notes[audioStep%notes.length];filter.type='lowpass';filter.frequency.value=380;gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(.055,time+.04);gain.gain.exponentialRampToValueAtTime(.0001,time+1.55);osc.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);osc.start(time);osc.stop(time+1.6);if(audioStep%4===0){const bass=audioContext.createOscillator(),bassGain=audioContext.createGain();bass.type='sine';bass.frequency.value=notes[audioStep%notes.length]/2;bassGain.gain.setValueAtTime(.0001,time);bassGain.gain.exponentialRampToValueAtTime(.09,time+.035);bassGain.gain.exponentialRampToValueAtTime(.0001,time+.38);bass.connect(bassGain);bassGain.connect(audioContext.destination);bass.start(time);bass.stop(time+.4)}audioStep++}
  function toggleAudio(){if(state.audio){state.audio=false;clearInterval(audioLoop);if(audioContext){audioContext.close();audioContext=null}render();save();return}const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){toast('Trình duyệt này chưa hỗ trợ phát nhạc.');return}audioContext=new Audio();audioContext.resume();audioStep=0;state.audio=true;playAudioStep();audioLoop=setInterval(playAudioStep,850);render();save()}
  $('soundToggle').addEventListener('click',toggleAudio);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});
  function drawScene(){const canvas=$('cafeScene'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,t=Date.now()/1000;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,w,h);const rect=(x,y,rw,rh,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,rw,rh)};const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fill()};
    const orderDuration=Math.max(15000,state.orderExpires-state.orderStarted||15000),moveRatio=Math.min(1,Math.max(0,(Date.now()-state.orderStarted)/orderDuration));const playerX=activeBrew?740:155+moveRatio*470;const playerBob=Math.sin(t*8)*2;const playerY=343+playerBob;
    const hallucinating=state.hallucinationUntil>Date.now();
    const horrorIntensity=hallucinating?Math.min(1,.4+(state.paranoia||0)*.003+Math.max(0,state.served-5)*.035):0;
    document.documentElement.classList.toggle('horror-overload',hallucinating);
    document.body.style.setProperty('--horror-level',horrorIntensity.toFixed(2));
    document.body.style.setProperty('--horror-saturation',(1+horrorIntensity*1.5).toFixed(2));
    document.body.style.setProperty('--horror-contrast',(1+horrorIntensity*.2).toFixed(2));
    document.body.style.setProperty('--horror-jolt',(horrorIntensity*3).toFixed(1)+'px');
    document.body.style.setProperty('--horror-jolt-negative',(-horrorIntensity*3).toFixed(1)+'px');
    document.body.style.setProperty('--horror-overlay-opacity',(.25+horrorIntensity*.45).toFixed(2));
    document.body.style.setProperty('--horror-overlay-flash',(.4+horrorIntensity*.5).toFixed(2));

    rect(0,0,w,h,'#040d1b');
    rect(0,0,w,220,'#071d36');
    rect(0,220,w,170,'#0b1f36');
    rect(0,280,w,140,'#0d1d2f');

    const moonX=714, moonY=102, moonR=48;
    ctx.fillStyle='rgba(255,245,205,0.98)';ctx.beginPath();ctx.arc(moonX,moonY,moonR,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,247,222,0.15)';ctx.beginPath();ctx.arc(moonX-12,moonY-10,60,0,Math.PI*2);ctx.fill();

    for(let i=0;i<80;i++){const x=(i*29+17)%w, y=(i*19+13)%150; if(i%2===0) rect(x,y,3,3,'rgba(255,255,255,0.9)');}
    for(let i=0;i<16;i++){const cloudX=(i*58+Math.sin(t*0.45+i)*16)%(w+60);const cloudY=18+(i*10)%70;rect(cloudX,cloudY,30,8,'rgba(112,146,208,0.28)');rect(cloudX+8,cloudY-7,18,8,'rgba(112,146,208,0.34)');rect(cloudX+20,cloudY-3,16,7,'rgba(112,146,208,0.22)');}

    for(let i=0;i<22;i++){const bx=20+i*33;const bh=52+((i*17)%130);rect(bx,176-bh,26,bh,'#091a2a');
      for(let yy=0;yy<bh;yy+=8){const wx=bx+3+(yy%2)*7; const ww=(yy/8)%2===0?4:5; rect(wx,180-bh+yy,ww,4,(i%4===0?'#ffbf54':i%4===1?'#7de6ff':i%4===2?'#ff66d8':'#7ee9d5'));}}
    for(let i=0;i<9;i++){const bx=90+i*104;const h=38+(i*9)%64;rect(bx,170-h,36,h,'#0b1a2f'); rect(bx+8,170-h+8,7,7,'#ffd27d'); rect(bx+21,170-h+8,7,7,'#78deff'); rect(bx+11,170-h+22,14,8,'#f16be1');}

    rect(0,212,w,26,'#0c1a2d');
    rect(0,238,w,120,'#031b31');
    rect(0,238,w,16,'#145bb7');
    rect(0,254,w,8,'#081a2b');

    const riverY=260;
    rect(0,riverY,w,94,'#0a2a69');
    rect(0,riverY+20,w,5,'rgba(153,207,255,0.62)');
    for(let i=0;i<42;i++){const x=i*24;rect(x,riverY+42,15,6,'rgba(255,218,129,0.30)');}
    for(let i=0;i<15;i++){const x=38+i*55;rect(x,riverY+60,10,10,'#ff9c7f');}

    rect(270,198,360,26,'#101924');
    rect(286,170,330,36,'#081a2b');
    for(let i=0;i<18;i++){const x=302+i*18;rect(x,180,7,16,'#f7d58d');rect(x+2,196,3,8,'#f0c566');}
    rect(255,192,390,14,'#f7d58d');
    rect(250,206,400,12,'#f2d087');
    rect(300,188,14,42,'#d36a4d');rect(586,188,14,42,'#d36a4d');
    for(let i=0;i<11;i++){const x=332+i*24;rect(x,188,10,8,'rgba(255,255,255,0.7)');}

    rect(0,312,w,18,'#101c2b');
    rect(0,330,w,90,'#1b1b1c');

    const menuX=28, menuY=210, menuW=138, menuH=138;
    rect(menuX,menuY,menuW,menuH,'#1a160d');rect(menuX+6,menuY+6,menuW-12,menuH-12,'#3d261b');
    rect(menuX+10,menuY+8,menuW-20,8,'#d7b26e');rect(menuX+10,menuY+16,menuW-20,2,'#ffe9b7');
    ctx.fillStyle='#ffe8b8';ctx.font='bold 18px monospace';ctx.fillText('MENU',menuX+28,menuY+30);
    ctx.fillStyle='#ffd577';ctx.font='bold 11px monospace';
    ctx.fillText('Latte 22k',menuX+18,menuY+58);ctx.fillText('Matcha 25k',menuX+18,menuY+74);ctx.fillText('Mocha 28k',menuX+18,menuY+90);ctx.fillText('Ramen 42k',menuX+18,menuY+106);ctx.fillText('Overclock 46k',menuX+18,menuY+122);ctx.fillText('Bionic 70k',menuX+18,menuY+138);
    ctx.fillStyle='#ffe5a8';ctx.fillRect(menuX+10,menuY+128,menuW-20,2);

    for(let i=0;i<5;i++){const sx=155+i*175;rect(sx,358,58,46,'#4a2d1a');rect(sx+8,349,42,16,'#7a4b2d');rect(sx+12,370,6,20,'#f7d76d');rect(sx+25,370,6,20,'#f7d76d');rect(sx+38,370,6,20,'#f7d76d');}
    for(let i=0;i<11;i++){const x=190+i*52;rect(x,290,38,40,'#3d2d1c');rect(x+8,278,20,16,'#f7d27c');rect(x+7,256,22,18,'#d19a63');rect(x+11,250,14,7,'#f6ce7a');}

    rect(0,370,w,60,'#181d1e');
    rect(0,440,w,14,'#d4ab62');

    const floorGradient=ctx.createLinearGradient(0,326,0,h);floorGradient.addColorStop(0,'#27343d');floorGradient.addColorStop(.45,'#302d38');floorGradient.addColorStop(1,'#12191f');
    poly([[0,326],[w,326],[w,h],[0,h]],floorGradient);
    const vanishingX=w*.5,vanishingY=326;
    ctx.lineWidth=1;
    for(let i=1;i<8;i++){const depth=i/8,y=vanishingY+(h-vanishingY)*depth*depth;ctx.strokeStyle=`rgba(118,195,214,${.04+depth*.13})`;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
    for(let i=0;i<=8;i++){const floorX=i*w/8;ctx.strokeStyle='rgba(123,207,224,0.12)';ctx.beginPath();ctx.moveTo(vanishingX,vanishingY);ctx.lineTo(floorX,h);ctx.stroke()}
    const floorGlow=ctx.createRadialGradient(vanishingX,vanishingY,4,vanishingX,vanishingY,360);floorGlow.addColorStop(0,'rgba(78,209,221,0.2)');floorGlow.addColorStop(1,'rgba(78,209,221,0)');ctx.fillStyle=floorGlow;ctx.fillRect(0,vanishingY,w,h-vanishingY);

    ctx.save();ctx.shadowColor='rgba(0,0,0,0.5)';ctx.shadowBlur=18;ctx.shadowOffsetY=8;poly([[266,280],[620,280],[680,300],[302,300]],'#472c31');ctx.restore();
    poly([[302,296],[650,296],[650,333],[302,333]],'#75463e');
    poly([[650,296],[680,280],[680,317],[650,333]],'#382530');
    poly([[266,280],[620,280],[680,300],[302,300]],'#e1a76e');
    poly([[281,282],[614,282],[653,295],[302,295]],'#56434b');
    poly([[302,296],[650,296],[650,302],[302,302]],'#ffd18a');
    rect(328,310,142,14,'#4c3035');rect(328,310,142,3,'#c47962');
    rect(507,310,102,14,'#4c3035');rect(507,310,102,3,'#c47962');
    poly([[650,296],[680,280],[680,286],[650,302]],'#f3bd7b');

    const playerXRound=Math.round(playerX), playerYRound=Math.round(playerY);
    rect(playerXRound,playerYRound,22,16,'#0f1218');rect(playerXRound+4,playerYRound-12,14,12,'#232d39');rect(playerXRound+6,playerYRound-15,8,5,'#e8d8c4');rect(playerXRound+4,playerYRound-13,3,3,'#1a1d22');rect(playerXRound+15,playerYRound-13,3,3,'#1a1d22');rect(playerXRound+5,playerYRound+16,5,12,'#1a1d22');rect(playerXRound+14,playerYRound+16,5,12,'#1a1d22');rect(playerXRound+3,playerYRound+2,3,10,'#1a1d22');rect(playerXRound+16,playerYRound+2,3,10,'#1a1d22');rect(playerXRound+6,playerYRound+18,3,8,'#1a1d22');rect(playerXRound+13,playerYRound+18,3,8,'#1a1d22');rect(playerXRound+20,playerYRound+2,22,6,'#d7ae73');rect(playerXRound+22,playerYRound+8,18,4,'#f0c27e');if(activeBrew){rect(playerXRound+30,playerYRound-8,8,8,'#f7b85a');rect(playerXRound+33,playerYRound-15,3,8,'#8de6d8');}

    ctx.fillStyle='rgba(0,0,0,0.18)';ctx.fillRect(0,350,w,10);ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(0,0,w,h);
    if(state.weatherId==='acid'){ctx.strokeStyle='rgba(144,231,187,.35)';ctx.lineWidth=2;for(let i=0;i<26;i++){const x=(i*37+t*90)%w,y=(i*61+t*175)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+12);ctx.stroke();}}else if(state.weatherId==='fog'){rect(0,120,w,170,'rgba(200,220,215,.12)');rect(0,280,w,85,'rgba(200,220,215,.08)');}else{ctx.fillStyle=`rgba(142,176,255,${0.10+Math.sin(t*1.8)*0.04})`;ctx.fillRect(0,0,w,h);}
    if(state.ghostOrder && state.ghostOrder.expires>Date.now()){
      ctx.fillStyle='rgba(123,20,95,0.22)';ctx.fillRect(560,90,120,180);
      ctx.fillStyle='rgba(230,215,255,0.24)';ctx.fillRect(590,120,50,80);
      ctx.fillStyle='rgba(255,35,90,0.65)';ctx.fillRect(601,143,6,5);ctx.fillRect(625,143,6,5);
    }
    if(hallucinating){
      const pulse=.12+Math.abs(Math.sin(t*9))*.1+horrorIntensity*.13;
      ctx.fillStyle=`rgba(255,20,72,${pulse})`;ctx.fillRect(0,0,w,h);
      ctx.fillStyle=`rgba(130,20,255,${pulse*.7})`;ctx.fillRect(0,0,w,h);
      ctx.globalCompositeOperation='screen';
      for(let i=0;i<9;i++){const y=(i*53+t*(90+i*8))%h;ctx.fillStyle=`rgba(${i%2?255:20},${i%2?24:210},${i%2?110:255},${.12+horrorIntensity*.14})`;ctx.fillRect(0,y,w,3+Math.floor(horrorIntensity*8));}
      ctx.globalCompositeOperation='source-over';
      ctx.strokeStyle=`rgba(255,220,250,${.22+horrorIntensity*.28})`;ctx.lineWidth=2;
      for(let i=0;i<12;i++){const x=(i*79+Math.sin(t*8+i)*35)%w;ctx.beginPath();ctx.moveTo(x,210);ctx.lineTo(x+24,255+i*3);ctx.stroke();}
    }
    const introCanvas=$('introScene');
    if(introCanvas&&!sessionStarted)introCanvas.getContext('2d').drawImage(canvas,0,0);
  }
  drawScene();setInterval(()=>{if(document.visibilityState==='visible')drawScene()},50);$('waveBars').innerHTML='<i></i>'.repeat(28);checkBadges();
  if(awaySeconds>0&&offlineGain===0&&awaySeconds>=OFFLINE_CAP)toast('Bạn đã vắng mặt hơn 8 giờ. Thu nhập offline đã chạm giới hạn.');
  render();save();applyUiSettings();
  $('replayTutorial').addEventListener('click',replayTutorial);
  $('tutorialContinue').addEventListener('click',doTutorialAction);$('tutorialSkip').addEventListener('click',skipTutorial);
  $('tutorialScreen').addEventListener('click',event=>{if(event.target===$('tutorialScreen'))enableOutsideTutorial()});$('tutorialDockExpand').addEventListener('click',reopenTutorial);$('tutorialDockSkip').addEventListener('click',skipTutorial);
  $('introEnter').addEventListener('click',()=>{if(sessionStarted)return;sessionStarted=true;document.body.classList.remove('intro-open');$('introScreen').classList.add('leaving');$('gameShell').inert=false;$('gameShell').removeAttribute('aria-hidden');window.scrollTo(0,0);state.lastSeen=Date.now();tickTimer=setInterval(tick,1000);if(!state.tutorialDone)startTutorial();else save();window.setTimeout(()=>$('introScreen').remove(),300)});
  $('creatorOpen').addEventListener('click',()=>{$('creatorDialog').hidden=false;$('creatorClose').focus()});$('creatorClose').addEventListener('click',()=>{$('creatorDialog').hidden=true;$('creatorOpen').focus()});$('creatorDialog').addEventListener('click',event=>{if(event.target===$('creatorDialog'))$('creatorClose').click()});$('creatorDialog').addEventListener('keydown',event=>{if(event.key==='Escape')$('creatorClose').click()});
})();
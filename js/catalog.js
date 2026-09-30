window.NEON_BREW_CATALOG = Object.freeze({
  recipes: [
    {id:'meteor',name:'Latte Sao Băng',icon:'☕',short:'Latte',details:'espresso · sữa yến mạch · quế',price:22,recipe:'Espresso · sữa yến mạch · bụi quế',tags:['caffeine','hot']},
    {id:'matcha',name:'Matcha Ánh Trăng',icon:'🍵',short:'Matcha',details:'matcha · sữa · mật ong',price:25,recipe:'Matcha · sữa hạt · mật ong',tags:['bold']},
    {id:'mocha',name:'Mocha Nửa Đêm',icon:'🥤',short:'Mocha',details:'cacao · espresso · kem',price:28,recipe:'Cacao đen · espresso · kem mây',tags:['caffeine','bold','hot']},
    {id:'ramen',name:'Mì Ramen Synth-Pork',icon:'🍜',short:'Ramen',details:'mì tổng hợp · synth-pork · dầu ớt',price:42,recipe:'Mì synth · thịt tổng hợp · dầu ớt',tags:['bold','hot','ramen']},
    {id:'overclock',name:'Overclock Matcha',icon:'🍵',short:'Overclock',details:'matcha · shot espresso · siro tăng tốc',price:46,recipe:'Matcha · espresso kép · Quantum Syrup',tags:['caffeine','energy','premium','overclock']},
    {id:'bionic',name:'Bít Tết Bionic',icon:'🥩',short:'Bionic',details:'bít tết tổng hợp · dầu năng lượng',price:70,recipe:'Bionic steak · dầu bôi trơn năng lượng',tags:['energy','bold','premium','bionic']}
  ],
  ingredients: [
    {id:'espresso',name:'Cyber Espresso',icon:'◉',cost:12,start:4,tag:'caffeine'},
    {id:'plasma',name:'Plasma Milk',icon:'◌',cost:15,start:4,tag:'bold'},
    {id:'boba',name:'Neon Boba',icon:'◍',cost:18,start:4,tag:'energy'},
    {id:'syrup',name:'Quantum Syrup',icon:'◇',cost:22,start:4,tag:'legend'}
  ],
  factions: [
    {id:'hackers',name:'Hackers',icon:'⌘',want:'caffeine',perk:'Mốc 10: máy pha nhanh hơn 15%; mốc 25: tăng tỉ lệ nghiên cứu.'},
    {id:'samurai',name:'Street Samurai',icon:'⚔',want:'bold',perk:'Mốc 10: tiền bo +20%; mốc 25: tiền thưởng đơn +10%.'},
    {id:'corporate',name:'Corporate Suits',icon:'▥',want:'premium',perk:'Đơn trả cao, nhưng thời gian chờ ngắn hơn.'},
    {id:'cyborgs',name:'Android / Cyborgs',icon:'◉',want:'energy',perk:'Mốc 10: thu nhập robot +20%; mốc 25: đơn năng lượng +20%.'}
  ],
  weathers: [
    {id:'acid',name:'Bão Mưa Axit',icon:'☂',effect:'Khách giảm 50%; giao hàng tăng 200%, món nóng +50%.'},
    {id:'fog',name:'Sương Mù Cyber',icon:'▧',effect:'Sương điện tử phủ phố; khách Corporate xuất hiện nhiều hơn.'},
    {id:'neon',name:'Đêm Neon',icon:'✦',effect:'Lượng khách Android / Cyborg tăng gấp đôi.'}
  ],
  decorItems: [
    {id:'neonSign',name:'Bảng hiệu Neon',icon:'▱',description:'Tăng 15 điểm phần trăm tỉ lệ khách VIP.',cost:220},
    {id:'pixelFloor',name:'Sàn & bàn Pixel',icon:'▦',description:'Tăng sức chứa chờ khách, thưởng thêm 20% tiền đơn.',cost:180},
    {id:'airFilter',name:'Lọc khí lượng tử',icon:'≋',description:'Giảm 80% nguy cơ máy móc hỏng.',cost:260}
  ],
  tracks: [
    {id:'afterglow',name:'Afterglow FM',style:'Lo-fi tape · 72 BPM',cost:0,notes:[110,130.81,164.81,146.83,98,130.81,174.61,146.83]},
    {id:'rain',name:'Window Rain',style:'Dusty keys · 68 BPM',cost:160,notes:[98,123.47,146.83,164.81,110,138.59,164.81,146.83]},
    {id:'synth',name:'Chrome Sunset',style:'Synthwave · 84 BPM',cost:260,notes:[82.41,110,138.59,164.81,92.5,123.47,155.56,185]}
  ],
  upgrades: [
    {id:'machine',icon:'▤',name:'Máy pha Ion-X',description:'Tăng tiền thưởng đơn hàng +15%.',base:75,effect:'machine'},
    {id:'sign',icon:'▱',name:'Bảng hiệu Neon',description:'Khách hào phóng hơn, thêm +10% tiền.',base:110,effect:'sign'},
    {id:'grinder',icon:'⚙',name:'Máy xay Lượng Tử',description:'Rút ngắn thời gian pha, tăng thu nhập robot.',base:145,effect:'grinder'},
    {id:'robotCore',icon:'◉',name:'Lõi Robot R-08',description:'Tăng thu nhập tự động thêm 25%.',base:190,effect:'robotCore',oneTime:true},
    {id:'premiumBeans',icon:'✦',name:'Hạt Cà Phê Quang Tử',description:'Tăng giá trị mọi món thêm 10%.',base:230,effect:'premiumBeans',oneTime:true},
    {id:'tipJar',icon:'◇',name:'Hũ Tiền Tip Thông Minh',description:'Đơn chính xác nhận thêm 10% tiền.',base:275,effect:'tipJar',oneTime:true},
    {id:'labScanner',icon:'⌕',name:'Máy Quét Phổ Công Thức',description:'Tăng cơ hội nghiên cứu thành công 10 điểm phần trăm.',base:320,effect:'labScanner',oneTime:true},
    {id:'vipBeacon',icon:'⌁',name:'Beacon Khách VIP',description:'Tăng cơ hội đón khách VIP 10 điểm phần trăm.',base:370,effect:'vipBeacon',oneTime:true},
    {id:'securityGrid',icon:'▦',name:'Lưới An Ninh Neon',description:'Sự cố khu phố xuất hiện thưa hơn 30 giây.',base:420,effect:'securityGrid',oneTime:true},
    {id:'branchNet',icon:'⌘',name:'Mạng Điều Phối Chi Nhánh',description:'Tăng thu nhập robot thêm 20%.',base:490,effect:'branchNet',oneTime:true},
    {id:'loyaltyCard',icon:'♡',name:'Thẻ Thành Viên',description:'Pha đúng đơn nhận thêm 1 danh tiếng.',base:560,effect:'loyaltyCard',oneTime:true},
    {id:'deliveryFleet',icon:'➤',name:'Trạm Sạc Drone',description:'Tăng thu nhập giao hàng thêm 20%.',base:640,effect:'deliveryFleet',oneTime:true}
  ],
  storyEvents: {
    ransomware:{title:'Robot bị nhiễm Ransomware',copy:'☠ Màn hình hiện đầu lâu. Hacker khóa firmware barista và đòi 10% quỹ bằng Bitcoin / Credits.'},
    union:{title:'Lớp Học Yêu Thương Rô-bốt',copy:'Liên đoàn robot đòi dầu nhớt tốt và 30 phút sạc/ngày. Chấp nhận: bảo trì +5%/giờ, tốc độ +15%. Format: 30% hồi phục, 70% mất 1 robot.'},
    yakuza:{title:'Yakuza ghé thăm',copy:'Mùi Ramen Synth-Pork kéo Yakuza tới. Họ đề nghị bảo kê khu phố.'},
    bulk:{title:'Tập đoàn IT đặt hàng',copy:'Overclock Matcha kích hoạt đơn hàng số lượng lớn trong thời hạn ngắn.'},
    arena:{title:'Đấu sĩ Cyborg',copy:'Một võ sĩ vừa rời võ đài ghé quán để nạp năng lượng.'},
    matrix:{title:'Glitch in the Matrix',copy:'Mười giây trong quán lặp lại ba lần. Thu nhập trong vòng lặp được nhân ba.'}
  }
});

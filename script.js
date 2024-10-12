// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyCFzG3wYlRxNxYKbScO9-WzBi-dFqDkfS4",
    authDomain: "zsga-6b03f.firebaseapp.com",
    projectId: "zsga-6b03f",
    storageBucket: "zsga-6b03f.appspot.com",
    messagingSenderId: "6093820960",
    appId: "1:6093820960:web:6eabc061d37a17b7f51845"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const groupContainer = document.getElementById('groupContainer'); // 假设这个是用于显示分组的容器

// 读取分组数据
function loadGroups() {
    db.collection("groups").onSnapshot((querySnapshot) => {
        // 清空现有的组信息
        groupContainer.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const groupData = doc.data();
            addGroup(doc.id, groupData.groupName, groupData.skill, groupData.className, groupData.studentName);
            // 为组员创建一个监听器
            listenForMembers(doc.id); // 传入组的 ID
        });
    });
}

// 加载组员
function loadMembers(groupId, membersListContainer) {
    db.collection("members").where("groupId", "==", groupId).get().then((querySnapshot) => {
        const members = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            members.push({
                className: data.className,
                studentName: data.studentName
            });
        });
        updateGroupMembers(groupId, members);
    }).catch((error) => {
        console.error("Error loading members: ", error);
    });
}

// 新增分组
function addGroupToFirestore(groupName, skill, className, studentName, groupCode) {
    db.collection("groups").add({
        groupName,
        skill,
        className,
        studentName,
        members: [],
        groupCode // 新增组别代码
    }).then((docRef) => {
        addGroup(docRef.id, groupName, skill, className, studentName, groupCode);
    }).catch((error) => {
        console.error("Error adding document: ", error);
    });
}

function listenForMembers(groupId) {
    db.collection("members").where("groupId", "==", groupId).onSnapshot((querySnapshot) => {
        const members = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            members.push({
                className: data.className, // 获取班级
                studentName: data.studentName // 获取组员姓名
            });
        });
        updateGroupMembers(groupId, members);
    });
}


// 将分组添加到页面
// 将分组添加到页面
function addGroup(id, groupName, skill, className, studentName) {
    const groupCard = document.createElement('div');
    groupCard.className = 'group';
    groupCard.id = id; 
    
    const groupHeader = document.createElement('h3');
    groupHeader.textContent = groupName;
    groupCard.appendChild(groupHeader);
  
    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle';
    toggleButton.textContent = '展開';
    groupCard.appendChild(toggleButton);
  
    const groupContent = document.createElement('div');
    groupContent.className = 'group-content';
    groupContent.innerHTML = `
      <p><strong>擅長項目:</strong> ${skill}</p>
      <p><strong>組長:</strong> ${className} - ${studentName}</p>
      <div class="members-list"></div> <!-- 显示组员的容器 -->
    `;
    groupCard.appendChild(groupContent);
  
    // 加入組別的按鈕
    const joinButton = document.createElement('button');
    joinButton.textContent = '加入組別';
    joinButton.style.display = 'none'; // 初始隱藏
    groupCard.appendChild(joinButton);
  
    // 点按展开或折叠
    toggleButton.addEventListener('click', () => {
      if (groupContent.style.display === 'none' || !groupContent.style.display) {
        groupContent.style.display = 'block';
        joinButton.style.display = 'inline-block'; // 顯示加入按鈕
        toggleButton.textContent = '摺疊';
  
        // 动态加载组员
        loadMembers(id, groupContent.querySelector('.members-list')); // 传递组别 ID 和成员列表容器
      } else {
        groupContent.style.display = 'none';
        joinButton.style.display = 'none'; // 隐藏加入按鈕
        toggleButton.textContent = '展開';
      }
    });
  
    // 加入組別彈窗
    joinButton.addEventListener('click', () => {
      showJoinGroupModal(className, studentName, id); // 传递 groupId
    });
  
    groupContainer.appendChild(groupCard);
}


// 更新组员显示
// 更新组员显示
function updateGroupMembers(groupId, members) {
    const groupCard = document.getElementById(groupId);
    const membersListContainer = groupCard.querySelector('.members-list');
    membersListContainer.innerHTML = ''; // 清空当前的成员列表

    members.forEach(member => {
        const memberItem = document.createElement('p');
        memberItem.textContent = `${member.className} - ${member.studentName}`; // 显示班级和姓名
        membersListContainer.appendChild(memberItem);
    });

    if (members.length === 0) {
        membersListContainer.innerHTML = '<p>尚未有組員加入</p>'; // 如果没有成员
    }
}


// 显示加入组别弹窗
function showJoinGroupModal(className, studentName, groupId, groupCode) {
    const joinGroupModal = document.createElement('div');
    joinGroupModal.className = 'modal';
    joinGroupModal.style.display = 'flex';
    joinGroupModal.innerHTML = `
      <div class="modal-content">
        <span class="close-btn" onclick="this.parentElement.parentElement.remove()">×</span>
        <h2>加入組別</h2>
        <label for="joinClassName">班級:</label>
        <input type="text" id="joinClassName" placeholder="輸入班級">
        <label for="joinStudentName">姓名:</label>
        <input type="text" id="joinStudentName" placeholder="輸入姓名">
        <label for="joinGroupCode">組別代碼:</label>
        <input type="text" id="joinGroupCode" placeholder="輸入組別代碼"> <!-- 新增输入框 -->
        <button id="joinGroupConfirmBtn">確認加入</button>
        <div class="alert" id="joinAlert"></div>
      </div>
    `;
    document.body.appendChild(joinGroupModal);

    document.getElementById('joinGroupConfirmBtn').addEventListener('click', () => {
        const joinClassName = document.getElementById('joinClassName').value;
        const joinStudentName = document.getElementById('joinStudentName').value;
        const joinGroupCode = document.getElementById('joinGroupCode').value; // 获取输入的组别代码

        const alertBox = document.getElementById('joinAlert');

        // 从 Firestore 获取对应组别的代码
        db.collection("groups").doc(groupId).get().then((doc) => {
            if (doc.exists) {
                const groupData = doc.data();
                if (joinGroupCode === groupData.groupCode) { // 验证代码
                    if (joinClassName && joinStudentName) {
                        addMemberToFirestore(groupId, joinClassName, joinStudentName);
                        alertBox.textContent = `已成功加入組別！班級: ${joinClassName}, 姓名: ${joinStudentName}`;
                        alertBox.style.color = "#5cb85c";
                        setTimeout(() => {
                            joinGroupModal.remove();
                        }, 2000);
                    } else {
                        alertBox.textContent = "請填寫所有欄位！";
                        alertBox.style.color = "#d9534f";
                    }
                } else {
                    alertBox.textContent = "組別代碼錯誤！";
                    alertBox.style.color = "#d9534f";
                }
            }
        }).catch((error) => {
            console.error("Error getting document:", error);
        });
    });
}

// 新增成員
function addMemberToFirestore(groupId, className, studentName) {
    db.collection('members').add({
        groupId,
        className,
        studentName
    }).then(() => {
        console.log("Member added successfully");
    }).catch((error) => {
        console.error("Error adding member: ", error);
    });
}

// 当 DOM 加载完成后
document.addEventListener('DOMContentLoaded', function () {
    loadGroups(); // 加载分组数据
  
    const createGroupBtn = document.getElementById('createGroupBtn');
    const createGroupModal = document.getElementById('createGroupModal');
    const closeCreateGroupModal = document.getElementById('closeCreateGroupModal');
    const createGroupConfirmBtn = document.getElementById('createGroupConfirmBtn');
  
    createGroupBtn.addEventListener('click', () => {
        createGroupModal.style.display = 'flex';
    });
  
    closeCreateGroupModal.addEventListener('click', () => {
        createGroupModal.style.display = 'none';
    });
  
    createGroupConfirmBtn.addEventListener('click', () => {
        const groupName = document.getElementById('groupName').value;
        const skill = document.getElementById('skill').value;
        const className = document.getElementById('className').value;
        const studentName = document.getElementById('studentName').value;
        const groupCode = document.getElementById('groupCode').value; // 获取组别代码
    
        if (groupName && skill && className && studentName && groupCode) {
            addGroupToFirestore(groupName, skill, className, studentName, groupCode);
            createGroupModal.style.display = 'none';
            document.getElementById('groupName').value = '';
            document.getElementById('skill').value = '';
            document.getElementById('className').value = '';
            document.getElementById('studentName').value = '';
            document.getElementById('groupCode').value = ''; // 清空代码输入框
        }
    });
});

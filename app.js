const STORAGE_KEY = "blog-platform-demo-state-v1";

const defaultState = {
  sessionUserId: "user-1",
  editingPostId: null,
  users: [
    {
      id: "user-1",
      name: "Alex Johnson",
      email: "alex@blog.demo",
      password: "password123",
      bio: "Frontend engineer writing about UX, systems, and product thinking."
    },
    {
      id: "user-2",
      name: "Mia Chen",
      email: "mia@blog.demo",
      password: "password123",
      bio: "Full-stack builder documenting APIs, auth, and deployment workflows."
    }
  ],
  posts: [
    {
      id: "post-1",
      authorId: "user-1",
      title: "Designing a Calm Developer Dashboard",
      body: "A clean dashboard needs clear hierarchy, live signals, and fewer competing decisions.",
      comments: [
        {
          id: "comment-1",
          authorId: "user-2",
          text: "The hierarchy point is so important for noisy admin tools."
        }
      ],
      createdAt: "2026-04-20T09:30:00.000Z"
    },
    {
      id: "post-2",
      authorId: "user-2",
      title: "Why Auth Middleware Should Stay Boring",
      body: "Predictable middleware makes debugging easier and protects every route the same way.",
      comments: [],
      createdAt: "2026-04-20T12:20:00.000Z"
    }
  ]
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    return structuredClone(defaultState);
  }

  return JSON.parse(stored);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function getCurrentUser() {
  return state.users.find((user) => user.id === state.sessionUserId) || null;
}

function findUser(userId) {
  return state.users.find((user) => user.id === userId);
}

function setMessage(text, tone = "neutral") {
  const target = document.getElementById("authMessage");
  target.textContent = text;
  target.style.color = tone === "error" ? "#c64056" : tone === "success" ? "#1f8f62" : "#5d7267";
}

function renderProfile() {
  const currentUser = getCurrentUser();
  const profileCard = document.getElementById("profileCard");

  if (!currentUser) {
    profileCard.innerHTML = `
      <h3>No active session</h3>
      <p>Login to create posts, edit your content, and add comments as a signed-in user.</p>
    `;
    return;
  }

  const userPosts = state.posts.filter((post) => post.authorId === currentUser.id).length;
  profileCard.innerHTML = `
    <h3>${currentUser.name}</h3>
    <p>${currentUser.bio}</p>
    <p><strong>Email:</strong> ${currentUser.email}</p>
    <p><strong>Posts:</strong> ${userPosts}</p>
    <button type="button" onclick="logout()">Logout</button>
  `;
}

function resetComposer() {
  state.editingPostId = null;
  document.getElementById("postForm").reset();
  document.getElementById("submitPost").textContent = "Publish Post";
}

function renderPosts() {
  const feed = document.getElementById("postFeed");
  const currentUser = getCurrentUser();

  const markup = [...state.posts]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((post) => {
      const author = findUser(post.authorId);
      const isOwner = currentUser && currentUser.id === post.authorId;
      const commentsMarkup = post.comments
        .map((comment) => {
          const commentAuthor = findUser(comment.authorId);
          return `
            <div class="comment-item">
              <strong>${commentAuthor ? commentAuthor.name : "Unknown user"}</strong>
              <p>${comment.text}</p>
            </div>
          `;
        })
        .join("");

      return `
        <article class="post-card">
          <p class="post-meta">By ${author ? author.name : "Unknown"} • ${new Date(post.createdAt).toLocaleString()}</p>
          <h3>${post.title}</h3>
          <p>${post.body}</p>
          ${
            isOwner
              ? `
                <div class="post-actions">
                  <button type="button" data-edit-post="${post.id}">Edit</button>
                  <button type="button" class="ghost-btn" data-delete-post="${post.id}">Delete</button>
                </div>
              `
              : ""
          }
          <form class="comment-form" data-comment-form="${post.id}">
            <input type="text" name="comment" placeholder="Add a comment" required ${currentUser ? "" : "disabled"}>
            <button type="submit" ${currentUser ? "" : "disabled"}>Comment</button>
          </form>
          <div class="comment-list">${commentsMarkup || "<p class='post-meta'>No comments yet.</p>"}</div>
        </article>
      `;
    })
    .join("");

  feed.innerHTML = markup || "<p>No posts available.</p>";
}

function render() {
  renderProfile();
  renderPosts();
  saveState();
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  document.getElementById("loginForm").classList.toggle("active", tabName === "login");
  document.getElementById("signupForm").classList.toggle("active", tabName === "signup");
}

function login(email, password) {
  const user = state.users.find((item) => item.email === email && item.password === password);

  if (!user) {
    setMessage("Invalid email or password.", "error");
    return;
  }

  state.sessionUserId = user.id;
  setMessage(`Welcome back, ${user.name}.`, "success");
  render();
}

function logout() {
  state.sessionUserId = null;
  setMessage("You have been logged out.");
  render();
}

function signup(name, email, bio, password) {
  if (state.users.some((user) => user.email === email)) {
    setMessage("An account with this email already exists.", "error");
    return;
  }

  const user = {
    id: `user-${Date.now()}`,
    name,
    email,
    bio,
    password
  };

  state.users.push(user);
  state.sessionUserId = user.id;
  setMessage(`Account created for ${user.name}.`, "success");
  render();
}

function publishPost(title, body) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    setMessage("Login is required before publishing posts.", "error");
    return;
  }

  if (state.editingPostId) {
    const post = state.posts.find((item) => item.id === state.editingPostId);
    post.title = title;
    post.body = body;
    setMessage("Post updated successfully.", "success");
  } else {
    state.posts.push({
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      title,
      body,
      comments: [],
      createdAt: new Date().toISOString()
    });
    setMessage("Post published successfully.", "success");
  }

  resetComposer();
  render();
}

function editPost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) {
    return;
  }

  state.editingPostId = postId;
  document.getElementById("postTitle").value = post.title;
  document.getElementById("postBody").value = post.body;
  document.getElementById("submitPost").textContent = "Save Changes";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deletePost(postId) {
  state.posts = state.posts.filter((post) => post.id !== postId);
  setMessage("Post deleted.", "success");
  render();
}

function addComment(postId, text) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    setMessage("Login is required before commenting.", "error");
    return;
  }

  const post = state.posts.find((item) => item.id === postId);
  if (!post) {
    return;
  }

  post.comments.push({
    id: `comment-${Date.now()}`,
    authorId: currentUser.id,
    text
  });

  setMessage("Comment added.", "success");
  render();
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  login(
    document.getElementById("loginEmail").value.trim(),
    document.getElementById("loginPassword").value
  );
});

document.getElementById("signupForm").addEventListener("submit", (event) => {
  event.preventDefault();
  signup(
    document.getElementById("signupName").value.trim(),
    document.getElementById("signupEmail").value.trim(),
    document.getElementById("signupBio").value.trim(),
    document.getElementById("signupPassword").value
  );
  event.target.reset();
});

document.getElementById("postForm").addEventListener("submit", (event) => {
  event.preventDefault();
  publishPost(
    document.getElementById("postTitle").value.trim(),
    document.getElementById("postBody").value.trim()
  );
});

document.getElementById("resetPost").addEventListener("click", () => {
  resetComposer();
});

document.getElementById("postFeed").addEventListener("click", (event) => {
  const editId = event.target.dataset.editPost;
  const deleteId = event.target.dataset.deletePost;

  if (editId) {
    editPost(editId);
  }

  if (deleteId) {
    deletePost(deleteId);
  }
});

document.getElementById("postFeed").addEventListener("submit", (event) => {
  if (!event.target.matches("[data-comment-form]")) {
    return;
  }

  event.preventDefault();
  const postId = event.target.dataset.commentForm;
  const text = event.target.elements.comment.value.trim();
  if (!text) {
    return;
  }

  addComment(postId, text);
  event.target.reset();
});

render();
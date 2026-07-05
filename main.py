import tkinter as tk
from tkinter import messagebox

class AnalysisApp:
    def __init__(self, root: tk.Tk) -> None:
        """Initializes the main GUI window.
        
        Parameters
        ----------
        root : tk.Tk
            The root window object for the Tkinter application.
        """
        self.root = root
        self.root.title("Analysis Management System")
        self.root.geometry("900x600")
        
        # Data objects
        self.saved_code_text = ""       
        self.selected_analyses = []     
        
        # Build the interface
        self.create_widgets()

    def create_widgets(self) -> None:
        """Creates and arranges the widgets in the main window."""
        # 1. Top frame for buttons (centered at the top)
        self.top_frame = tk.Frame(self.root)
        self.top_frame.pack(side=tk.TOP, pady=15, fill=tk.X)
        
        # Rightmost button - opens the analysis selection window
        self.analysis_btn = tk.Button(
            self.top_frame, 
            text="➕ Select Analyses", 
            command=self.open_analysis_window,
            bg="#e0f7fa",
            font=("Arial", 10, "bold")
        )
        self.analysis_btn.pack(side=tk.RIGHT, padx=20)

        # 2. Main content frame (contains list on the left, textbox on the right)
        self.main_content = tk.Frame(self.root)
        self.main_content.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        # --- Left Panel (Analysis list and control buttons) ---
        self.left_panel = tk.Frame(self.main_content)
        # Pack to the left. fill=tk.Y allows the panel to take full height
        self.left_panel.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 20))

        tk.Label(
            self.left_panel, 
            text="Analysis Execution Order:", 
            font=("Arial", 12, "bold")
        ).pack(pady=(0, 5))

        # Listbox - Interactive list
        self.analyses_listbox = tk.Listbox(
            self.left_panel, 
            font=("Arial", 11), 
            selectmode=tk.SINGLE, 
            width=25
        )
        self.analyses_listbox.pack(fill=tk.Y, expand=True)

        # Control buttons below the list
        self.controls_frame = tk.Frame(self.left_panel)
        self.controls_frame.pack(pady=10)

        self.up_btn = tk.Button(self.controls_frame, text="⬆️ Move Up", command=self.move_up)
        self.up_btn.grid(row=0, column=0, padx=5)

        self.down_btn = tk.Button(self.controls_frame, text="⬇️ Move Down", command=self.move_down)
        self.down_btn.grid(row=0, column=1, padx=5)

        self.remove_btn = tk.Button(
            self.controls_frame, 
            text="❌ Remove Analysis", 
            command=self.remove_item, 
            bg="#ffcdd2"
        )
        self.remove_btn.grid(row=1, column=0, columnspan=2, pady=5, sticky="ew")

        # --- Right Panel (Textbox) ---
        self.text_frame = tk.Frame(self.main_content)
        # Pack to the left (after left panel), takes the remaining space
        self.text_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        self.textbox = tk.Text(self.text_frame, wrap=tk.WORD, font=("Courier New", 11))
        self.textbox.pack(fill=tk.BOTH, expand=True)

        # 3. Submit button at the bottom
        self.submit_btn = tk.Button(
            self.root, 
            text="Save Text / Code", 
            command=self.save_text_content,
            bg="#4CAF50",
            fg="white",
            font=("Arial", 12, "bold")
        )
        self.submit_btn.pack(side=tk.BOTTOM, pady=20)

    # --- Analysis Listbox Control Functions ---

    def move_up(self) -> None:
        """Moves the selected analysis one position up in the listbox."""
        selected_indices = self.analyses_listbox.curselection()
        if not selected_indices:
            return
        
        index = selected_indices[0]
        if index > 0:
            # Swap in the GUI listbox
            item = self.analyses_listbox.get(index)
            self.analyses_listbox.delete(index)
            self.analyses_listbox.insert(index - 1, item)
            self.analyses_listbox.selection_set(index - 1)
            
            # Synchronize the background data list
            self.selected_analyses.insert(index - 1, self.selected_analyses.pop(index))

    def move_down(self) -> None:
        """Moves the selected analysis one position down in the listbox."""
        selected_indices = self.analyses_listbox.curselection()
        if not selected_indices:
            return
        
        index = selected_indices[0]
        if index < self.analyses_listbox.size() - 1:
            # Swap in the GUI listbox
            item = self.analyses_listbox.get(index)
            self.analyses_listbox.delete(index)
            self.analyses_listbox.insert(index + 1, item)
            self.analyses_listbox.selection_set(index + 1)
            
            # Synchronize the background data list
            self.selected_analyses.insert(index + 1, self.selected_analyses.pop(index))

    def remove_item(self) -> None:
        """Removes the selected analysis from the listbox and data object."""
        selected_indices = self.analyses_listbox.curselection()
        if not selected_indices:
            return
        
        index = selected_indices[0]
        
        # Delete from GUI
        self.analyses_listbox.delete(index)
        
        # Delete from the background data list
        del self.selected_analyses[index]

    # --- General Functions ---

    def save_text_content(self) -> None:
        """Saves the text from the textbox object into a string variable."""
        self.saved_code_text = self.textbox.get("1.0", tk.END).strip()
        messagebox.showinfo(
            "Save Successful", 
            f"The text has been saved. In addition, the analysis execution order is:\n{self.selected_analyses}"
        )

    def open_analysis_window(self) -> None:
        """Opens a secondary window to select analyses from a predefined list."""
        analysis_window = tk.Toplevel(self.root)
        analysis_window.title("Analysis Repository")
        analysis_window.geometry("300x250")
        
        available_analyses = ["linear_regression", "data_cleaning", "clustering", "pca"]
        tk.Label(analysis_window, text="Select analysis to add:", font=("Arial", 12)).pack(pady=15)
        
        for analysis in available_analyses:
            btn = tk.Button(
                analysis_window, 
                text=analysis,
                command=lambda a=analysis: self.add_analysis_to_list(a)
            )
            btn.pack(pady=5, fill=tk.X, padx=40)

    def add_analysis_to_list(self, analysis_name: str) -> None:
        """Adds the selected analysis to the listbox and underlying data list.
        
        Parameters
        ----------
        analysis_name : str
            The name of the analysis to be added to the execution list."""
        # Add to the background data list
        self.selected_analyses.append(analysis_name)
        # Visual addition to the listbox
        self.analyses_listbox.insert(tk.END, analysis_name)
        messagebox.showinfo("Added", f"The analysis '{analysis_name}' was added successfully.")


if __name__ == "__main__":
    main_window = tk.Tk()
    app = AnalysisApp(main_window)
    main_window.mainloop()
package expo.modules.androidalertprompt

import android.app.AlertDialog
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.InputType
import android.view.Gravity
import android.widget.EditText
import android.widget.TextView
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class StyleOptions(
  // Dialog background
  @Field val backgroundColor: String? = null,
  @Field val borderRadius: Int? = null,
  @Field val borderColor: String? = null,
  @Field val borderWidth: Int? = null,
  
  // Title styling
  @Field val titleColor: String? = null,
  @Field val titleSize: Float? = null,
  @Field val titleAlignment: String? = null, // "left", "center", "right"
  @Field val titleBold: Boolean? = null,
  
  // Message styling
  @Field val messageColor: String? = null,
  @Field val messageSize: Float? = null,
  @Field val messageAlignment: String? = null,
  
  // Input styling
  @Field val inputBackgroundColor: String? = null,
  @Field val inputTextColor: String? = null,
  @Field val inputTextSize: Float? = null,
  @Field val inputBorderRadius: Int? = null,
  @Field val inputBorderColor: String? = null,
  @Field val inputBorderWidth: Int? = null,
  @Field val inputPadding: Int? = null,
  @Field val inputPlaceholderColor: String? = null,
  
  // Button styling
  @Field val buttonColor: String? = null,
  @Field val buttonSize: Float? = null,
  @Field val buttonBold: Boolean? = null,
  @Field val positiveButtonColor: String? = null,
  @Field val negativeButtonColor: String? = null
) : Record

data class PromptOptions(
  @Field val title: String,
  @Field val message: String? = null,
  @Field val defaultValue: String? = null,
  @Field val placeholder: String? = null,
  @Field val inputType: String = "plain-text",
  @Field val cancelable: Boolean = true,
  @Field val cancelOnBackdrop: Boolean = true,
  @Field val positiveText: String = "OK",
  @Field val negativeText: String = "Cancel",
  @Field val style: StyleOptions? = null
) : Record

class AndroidAlertPromptModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AndroidAlertPrompt")

    AsyncFunction("showPrompt") { options: PromptOptions, promise: Promise ->
      val activity = appContext.currentActivity ?: run {
        promise.reject("NO_ACTIVITY", "Activity not available", null)
        return@AsyncFunction
      }

      activity.runOnUiThread {
        val input = EditText(activity).apply {
          setText(options.defaultValue ?: "")
          hint = options.placeholder
          setSingleLine()
          
          inputType = when (options.inputType) {
            "password" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            "email" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            "numeric" -> InputType.TYPE_CLASS_NUMBER
            "phone" -> InputType.TYPE_CLASS_PHONE
            "decimal" -> InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
            else -> InputType.TYPE_CLASS_TEXT
          }
          
          // Apply input styling
          options.style?.let { style ->
            // Text color
            style.inputTextColor?.let { 
              try {
                setTextColor(Color.parseColor(it))
              } catch (e: Exception) {}
            }
            
            // Text size
            style.inputTextSize?.let {
              textSize = it
            }
            
            // Placeholder color
            style.inputPlaceholderColor?.let {
              try {
                setHintTextColor(Color.parseColor(it))
              } catch (e: Exception) {}
            }
            
            // Background with border
            val background = GradientDrawable().apply {
              // Background color
              style.inputBackgroundColor?.let {
                try {
                  setColor(Color.parseColor(it))
                } catch (e: Exception) {}
              }
              
              // Border radius
              cornerRadius = (style.inputBorderRadius ?: 8).toFloat() * resources.displayMetrics.density
              
              // Border
              if (style.inputBorderWidth != null && style.inputBorderColor != null) {
                try {
                  setStroke(
                    (style.inputBorderWidth * resources.displayMetrics.density).toInt(),
                    Color.parseColor(style.inputBorderColor)
                  )
                } catch (e: Exception) {}
              }
            }
            setBackground(background)
            
            // Padding
            val padding = ((style.inputPadding ?: 16) * resources.displayMetrics.density).toInt()
            setPadding(padding, padding, padding, padding)
          } ?: run {
            // Default padding if no style
            val padding = (16 * resources.displayMetrics.density).toInt()
            setPadding(padding, padding, padding, padding)
          }
        }

        val dialog = AlertDialog.Builder(activity)
          .setTitle(options.title)
          .apply { options.message?.let { setMessage(it) } }
          .setView(input)
          .setPositiveButton(options.positiveText) { _, _ ->
            promise.resolve(
              mapOf(
                "text" to input.text.toString(),
                "cancelled" to false
              )
            )
          }
          .setNegativeButton(options.negativeText) { dialog, _ ->
            dialog.cancel()
            promise.resolve(
              mapOf(
                "text" to null,
                "cancelled" to true
              )
            )
          }
          .setCancelable(options.cancelable && options.cancelOnBackdrop)
          .setOnCancelListener {
            promise.resolve(
              mapOf(
                "text" to null,
                "cancelled" to true
              )
            )
          }
          .create()

        // Handle back button
        dialog.setOnKeyListener { _, keyCode, event ->
          if (keyCode == android.view.KeyEvent.KEYCODE_BACK && 
              event.action == android.view.KeyEvent.ACTION_UP) {
            if (options.cancelable && options.cancelOnBackdrop) {
              dialog.cancel()
              true
            } else {
              true
            }
          } else {
            false
          }
        }

        dialog.window?.setSoftInputMode(
          android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE
        )
        
        dialog.show()
        
        // Apply styling after show()
        options.style?.let { style ->
          val density = activity.resources.displayMetrics.density
          
          // Dialog background with border
          dialog.window?.decorView?.let { decorView ->
            val background = GradientDrawable().apply {
              // Background color
              style.backgroundColor?.let {
                try {
                  setColor(Color.parseColor(it))
                } catch (e: Exception) {}
              }
              
              // Border radius
              cornerRadius = (style.borderRadius ?: 12).toFloat() * density
              
              // Border
              if (style.borderWidth != null && style.borderColor != null) {
                try {
                  setStroke(
                    (style.borderWidth * density).toInt(),
                    Color.parseColor(style.borderColor)
                  )
                } catch (e: Exception) {}
              }
            }
            decorView.setBackground(background)
          }
          
          // Title styling
          val titleId = activity.resources.getIdentifier("alertTitle", "id", "android")
          if (titleId > 0) {
            dialog.findViewById<TextView>(titleId)?.let { titleView ->
              style.titleColor?.let {
                try {
                  titleView.setTextColor(Color.parseColor(it))
                } catch (e: Exception) {}
              }
              
              style.titleSize?.let {
                titleView.textSize = it
              }
              
              style.titleAlignment?.let {
                titleView.gravity = when (it) {
                  "left" -> Gravity.START
                  "center" -> Gravity.CENTER
                  "right" -> Gravity.END
                  else -> Gravity.START
                }
              }
              
              style.titleBold?.let {
                if (it) {
                  titleView.setTypeface(titleView.typeface, Typeface.BOLD)
                }
              }
            }
          }
          
          // Message styling
          dialog.findViewById<TextView>(android.R.id.message)?.let { messageView ->
            style.messageColor?.let {
              try {
                messageView.setTextColor(Color.parseColor(it))
              } catch (e: Exception) {}
            }
            
            style.messageSize?.let {
              messageView.textSize = it
            }
            
            style.messageAlignment?.let {
              messageView.gravity = when (it) {
                "left" -> Gravity.START
                "center" -> Gravity.CENTER
                "right" -> Gravity.END
                else -> Gravity.START
              }
            }
          }
          
          // Button styling
          val positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
          val negativeButton = dialog.getButton(AlertDialog.BUTTON_NEGATIVE)
          
          // Positive button
          positiveButton?.let { btn ->
            (style.positiveButtonColor ?: style.buttonColor)?.let { color ->
              try {
                btn.setTextColor(Color.parseColor(color))
              } catch (e: Exception) {}
            }
            
            style.buttonSize?.let {
              btn.textSize = it
            }
            
            style.buttonBold?.let {
              if (it) {
                btn.setTypeface(btn.typeface, Typeface.BOLD)
              }
            }
          }
          
          // Negative button
          negativeButton?.let { btn ->
            (style.negativeButtonColor ?: style.buttonColor)?.let { color ->
              try {
                btn.setTextColor(Color.parseColor(color))
              } catch (e: Exception) {}
            }
            
            style.buttonSize?.let {
              btn.textSize = it
            }
            
            style.buttonBold?.let {
              if (it) {
                btn.setTypeface(btn.typeface, Typeface.BOLD)
              }
            }
          }
        }
        
        input.requestFocus()
      }
    }
  }
}
package net.enovea.api.workInProgress

import jakarta.annotation.Priority
import jakarta.interceptor.AroundInvoke
import jakarta.interceptor.Interceptor
import jakarta.interceptor.InterceptorBinding
import org.jboss.logging.Logger
import jakarta.interceptor.InvocationContext as CDIInvocationContext



@InterceptorBinding
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CLASS)
annotation class LogExecutionTime


@LogExecutionTime
@Interceptor
@Priority(Interceptor.Priority.APPLICATION)
class LogExecutionTimeInterceptor {
    private val LOG = Logger.getLogger(LogExecutionTimeInterceptor::class.java)

    @AroundInvoke
    fun measureMethodExecutionTime(context: CDIInvocationContext): Any? {
        val start = System.currentTimeMillis()
        try {
            // Procéder à l’exécution réelle de la méthode
            return context.proceed()
        } finally {
            val end = System.currentTimeMillis()
            val executionTime = end - start
            LOG.infof(
                "Méthode %s exécutée en %d ms",
                context.method.name, executionTime
            )
        }
    }
}